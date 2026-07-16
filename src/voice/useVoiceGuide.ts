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
const MIN_BLOB = 2400 // ignore near-empty recordings

function pickMime(): string {
  for (const c of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c
  }
  return ''
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
  const recRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
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
      form.append('audio', blob, `speech.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`)
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

    const rec = new MediaRecorder(stream, pickMime() ? { mimeType: pickMime() } : undefined)
    const chunks: Blob[] = []
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    rec.onstop = () => {
      stopMeter()
      releaseMic()
      const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' })
      if (blob.size < MIN_BLOB) {
        if (activeRef.current) {
          emptyTurnsRef.current += 1
          if (emptyTurnsRef.current < 2) listen()
          else setState('idle')
        } else setState('idle')
        return
      }
      void send(blob)
    }
    recRef.current = rec
    rec.start()
    setState('listening')

    // VAD: stop after sustained silence once speech has been heard
    const t0 = performance.now()
    let heardSpeech = false
    let quietSince = 0
    const tick = () => {
      if (!recRef.current || recRef.current.state !== 'recording') return
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
        else if (now - quietSince > SILENCE_MS) {
          rec.stop()
          return
        }
      }
      if (now - t0 > MAX_TURN_MS) {
        rec.stop()
        return
      }
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
    if (recRef.current?.state === 'recording') recRef.current.stop()
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
