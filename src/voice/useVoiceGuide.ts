import { useCallback, useEffect, useRef, useState } from 'react'
import { VOICE_PROXY_URL } from './voiceConfig'
import { scrollToSection } from '../lib/scrollNav'

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'

export interface Exchange {
  question?: string
  reply?: string
  note?: string
}

// silence-detection tuning for hands-free turns
const SPEAK_ON = 0.09 // level that counts as "the visitor is talking"
const SILENCE_MS = 1400 // hang-up after this much quiet once they've spoken
const MAX_TURN_MS = 14_000 // hard cap per turn
const MIN_SPEECH_S = 0.35 // ignore turns shorter than this
const OUT_RATE = 16_000 // Sarvam transcribes best at 16 kHz mono

/* We record raw PCM and encode WAV ourselves. MediaRecorder's WebM/Opus ships
 * without a duration header, which Sarvam's decoder rejects — but a clean WAV
 * (proven to work by curl) transcribes every time. */

function mergeFloat32(chunks: Float32Array[], length: number): Float32Array {
  const out = new Float32Array(length)
  let offset = 0
  for (const c of chunks) {
    out.set(c, offset)
    offset += c.length
  }
  return out
}

function downsample(buffer: Float32Array, inRate: number, outRate: number): Float32Array {
  if (outRate >= inRate) return buffer
  const ratio = inRate / outRate
  const outLen = Math.round(buffer.length / ratio)
  const out = new Float32Array(outLen)
  let iOut = 0
  let iIn = 0
  while (iOut < outLen) {
    const next = Math.round((iOut + 1) * ratio)
    let sum = 0
    let count = 0
    for (let i = iIn; i < next && i < buffer.length; i++) {
      sum += buffer[i]
      count++
    }
    out[iOut++] = count ? sum / count : 0
    iIn = next
  }
  return out
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const str = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i))
  }
  str(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  str(8, 'WAVE')
  str(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  str(36, 'data')
  view.setUint32(40, samples.length * 2, true)
  let off = 44
  for (let i = 0; i < samples.length; i++, off += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return new Blob([view], { type: 'audio/wav' })
}

/** Hands-free voice guide. First gesture greets in Aditya's voice, then loops:
 *  listen (with silence detection) → answer aloud → listen again. No text. */
export function useVoiceGuide() {
  const [state, setState] = useState<VoiceState>('idle')
  const [exchange, setExchange] = useState<Exchange>({})
  const levelRef = useRef(0)

  const ctxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef(0)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const captureStopRef = useRef<(() => void) | null>(null) // finalize current turn
  const activeRef = useRef(false) // conversation open → keep the loop going
  const emptyTurnsRef = useRef(0)
  const greetedRef = useRef(false) // greet only the first time

  const configured = VOICE_PROXY_URL.length > 0

  const stopMeter = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    levelRef.current = 0
  }, [])

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new AudioContext()
    if (ctxRef.current.state === 'suspended') void ctxRef.current.resume()
    return ctxRef.current
  }, [])

  const releaseMic = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const act = useCallback((action?: string) => {
    if (!action || action === 'none') return
    const [kind, target] = action.split(':')
    if (kind === 'scroll' && target) scrollToSection(target)
    else if (kind === 'open' && target) {
      window.dispatchEvent(new CustomEvent('plane:open', { detail: target }))
    }
  }, [])

  // forward declarations so the loop can reference each other
  const listenRef = useRef<() => void>(() => {})

  const playWav = useCallback(
    (b64: string): Promise<void> =>
      new Promise((resolve) => {
        const ctx = ensureCtx()
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
        ctx.decodeAudioData(
          bytes.buffer,
          (buffer) => {
            const src = ctx.createBufferSource()
            const analyser = ctx.createAnalyser()
            analyser.fftSize = 256
            src.buffer = buffer
            src.connect(analyser)
            analyser.connect(ctx.destination)
            sourceRef.current = src
            const data = new Uint8Array(analyser.frequencyBinCount)
            const loop = () => {
              analyser.getByteFrequencyData(data)
              let s = 0
              for (const v of data) s += v * v
              levelRef.current = Math.min(1, Math.sqrt(s / data.length) / 110)
              rafRef.current = requestAnimationFrame(loop)
            }
            rafRef.current = requestAnimationFrame(loop)
            src.onended = () => {
              stopMeter()
              resolve()
            }
            src.start()
          },
          () => resolve(),
        )
      }),
    [ensureCtx, stopMeter],
  )

  const speak = useCallback(
    async (b64: string | null) => {
      if (!b64) return
      setState('speaking')
      await playWav(b64)
    },
    [playWav],
  )

  const send = useCallback(
    async (blob: Blob) => {
      setState('thinking')
      const form = new FormData()
      form.append('audio', blob, 'speech.wav')
      try {
        const res = await fetch(`${VOICE_PROXY_URL}/voice`, { method: 'POST', body: form })
        if (!res.ok) {
          let msg = `voice error ${res.status}`
          try {
            const e = await res.json()
            if (e?.error) msg = e.error
          } catch {
            /* non-JSON error body */
          }
          setExchange((ex) => ({ ...ex, note: msg }))
          setState('error')
          return
        }
        const p = await res.json()
        const heard = (p.transcript ?? '').trim()
        if (!heard) {
          // caught silence — try one more listen, then rest
          emptyTurnsRef.current += 1
          if (activeRef.current && emptyTurnsRef.current < 2) {
            listenRef.current()
          } else {
            setState('idle')
          }
          return
        }
        emptyTurnsRef.current = 0
        setExchange({ question: heard, reply: p.speech || undefined })
        act(p.action)
        await speak(p.audio)
      } catch {
        setExchange((e) => ({ ...e, note: 'lost the thread for a second — tap to try again' }))
        setState('idle')
        return
      }
      // turn done → keep the conversation going
      if (activeRef.current) listenRef.current()
      else setState('idle')
    },
    [act, speak],
  )

  const listen = useCallback(async () => {
    if (!activeRef.current) return
    ensureCtx()
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setExchange({ note: 'I need mic access to hear you — enable it and tap the orb' })
      setState('error')
      activeRef.current = false
      return
    }
    streamRef.current = stream
    const ctx = ensureCtx()
    const micSrc = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    micSrc.connect(analyser)
    const data = new Uint8Array(analyser.frequencyBinCount)

    // raw PCM capture (mono) — encoded to WAV on stop
    const processor = ctx.createScriptProcessor(4096, 1, 1)
    const mute = ctx.createGain()
    mute.gain.value = 0
    micSrc.connect(processor)
    processor.connect(mute)
    mute.connect(ctx.destination)

    const pcm: Float32Array[] = []
    let pcmLen = 0
    processor.onaudioprocess = (e) => {
      const ch = e.inputBuffer.getChannelData(0)
      pcm.push(new Float32Array(ch)) // copy — the buffer is reused
      pcmLen += ch.length
    }

    let finalized = false
    const finish = () => {
      if (finalized) return
      finalized = true
      captureStopRef.current = null
      cancelAnimationFrame(rafRef.current)
      processor.disconnect()
      mute.disconnect()
      micSrc.disconnect()
      analyser.disconnect()
      releaseMic()
      levelRef.current = 0

      // conversation was closed while listening — discard, don't send
      if (!activeRef.current) {
        setState('idle')
        return
      }

      const seconds = pcmLen / ctx.sampleRate
      if (seconds < MIN_SPEECH_S) {
        // heard nothing — give one more try, then rest
        if (activeRef.current && emptyTurnsRef.current < 1) {
          emptyTurnsRef.current += 1
          listenRef.current()
        } else {
          emptyTurnsRef.current = 0
          setState('idle')
        }
        return
      }
      const merged = mergeFloat32(pcm, pcmLen)
      const wav = encodeWav(downsample(merged, ctx.sampleRate, OUT_RATE), OUT_RATE)
      void send(wav)
    }
    captureStopRef.current = finish
    setState('listening')

    // VAD: stop after sustained silence once speech has been heard
    const t0 = performance.now()
    let heardSpeech = false
    let quietSince = 0
    const tick = () => {
      if (finalized) return
      analyser.getByteFrequencyData(data)
      let s = 0
      for (const v of data) s += v * v
      const level = Math.min(1, Math.sqrt(s / data.length) / 110)
      levelRef.current = level
      const now = performance.now()
      if (level > SPEAK_ON) {
        heardSpeech = true
        quietSince = 0
      } else if (heardSpeech) {
        if (!quietSince) quietSince = now
        else if (now - quietSince > SILENCE_MS) return finish()
      }
      if (now - t0 > MAX_TURN_MS) return finish()
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [ensureCtx, releaseMic, send, stopMeter])

  listenRef.current = listen

  const stopSpeaking = useCallback(() => {
    try {
      sourceRef.current?.stop()
    } catch {
      /* noop */
    }
    sourceRef.current = null
    stopMeter()
  }, [stopMeter])

  const stopListening = useCallback(() => {
    captureStopRef.current?.()
  }, [])

  /** Begin the conversation: Aditya greets, then starts listening. */
  const start = useCallback(async () => {
    if (activeRef.current) return
    activeRef.current = true
    emptyTurnsRef.current = 0
    ensureCtx() // must be inside the gesture
    if (!configured) {
      setExchange({ note: 'voice is warming up — deploy the worker to hear me' })
      setState('error')
      activeRef.current = false
      return
    }
    if (greetedRef.current) {
      listen() // reopened — skip the greeting, just listen
      return
    }
    greetedRef.current = true
    setState('thinking')
    try {
      const res = await fetch(`${VOICE_PROXY_URL}/voice`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ greeting: true }),
      })
      const p = await res.json()
      setExchange({ reply: p.speech || undefined })
      await speak(p.audio)
    } catch {
      /* greeting is best-effort; still listen */
    }
    if (activeRef.current) listen()
  }, [configured, ensureCtx, speak, listen])

  /** Tap the orb: talk/stop while active, or (re)start the conversation. */
  const toggle = useCallback(() => {
    if (state === 'listening') stopListening()
    else if (state === 'speaking') {
      stopSpeaking()
      if (activeRef.current) listen()
    } else if (state === 'idle' || state === 'error') {
      if (activeRef.current) listen()
      else void start()
    }
  }, [state, stopListening, stopSpeaking, listen, start])

  const end = useCallback(() => {
    activeRef.current = false
    stopSpeaking()
    stopListening()
    releaseMic()
    stopMeter()
    setState('idle')
  }, [stopSpeaking, stopListening, releaseMic, stopMeter])

  useEffect(() => () => end(), [end])

  return { state, exchange, levelRef, start, toggle, end, configured }
}
