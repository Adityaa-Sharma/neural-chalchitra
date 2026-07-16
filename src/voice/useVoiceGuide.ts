import { useCallback, useEffect, useRef, useState } from 'react'
import { VOICE_PROXY_URL, matchLocalIntent } from './voiceConfig'
import { scrollToSection } from '../lib/scrollNav'

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'

export interface Exchange {
  transcript?: string
  reply?: string
  note?: string
}

const MAX_RECORD_MS = 18_000

function pickMime(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c
  }
  return ''
}

export function useVoiceGuide() {
  const [state, setState] = useState<VoiceState>('idle')
  const [exchange, setExchange] = useState<Exchange>({})
  const levelRef = useRef(0)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const stopTimerRef = useRef(0)

  const configured = VOICE_PROXY_URL.length > 0

  // meter loop: RMS of the analyser feeds levelRef (avatar reads it via rAF)
  const meter = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return
    const data = new Uint8Array(analyser.frequencyBinCount)
    const loop = () => {
      analyser.getByteFrequencyData(data)
      let sum = 0
      for (const v of data) sum += v * v
      levelRef.current = Math.min(1, Math.sqrt(sum / data.length) / 110)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [])

  const stopMeter = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    levelRef.current = 0
  }, [])

  const ensureCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    // must be resumed synchronously inside the user gesture (iOS)
    if (audioCtxRef.current.state === 'suspended') void audioCtxRef.current.resume()
    return audioCtxRef.current
  }, [])

  const stopPlayback = useCallback(() => {
    try {
      sourceRef.current?.stop()
    } catch {
      /* already stopped */
    }
    sourceRef.current = null
    stopMeter()
  }, [stopMeter])

  const releaseMic = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const act = useCallback((action: string | undefined) => {
    if (!action || action === 'none') return
    const [kind, target] = action.split(':')
    if (kind === 'scroll' && target) scrollToSection(target)
  }, [])

  const playBase64Wav = useCallback(
    async (b64: string, onDone: () => void) => {
      const ctx = ensureCtx()
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
      const buffer = await ctx.decodeAudioData(bytes.buffer)
      const src = ctx.createBufferSource()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      src.buffer = buffer
      src.connect(analyser)
      analyser.connect(ctx.destination)
      analyserRef.current = analyser
      sourceRef.current = src
      src.onended = () => {
        stopMeter()
        onDone()
      }
      src.start()
      meter()
    },
    [ensureCtx, meter, stopMeter],
  )

  const handleResponse = useCallback(
    async (payload: { transcript?: string; speech?: string; action?: string; audio?: string }) => {
      setExchange({ transcript: payload.transcript, reply: payload.speech })
      act(payload.action)
      if (payload.audio) {
        setState('speaking')
        try {
          await playBase64Wav(payload.audio, () => setState('idle'))
          return
        } catch {
          /* fall through to silent finish */
        }
      }
      setState('idle')
    },
    [act, playBase64Wav],
  )

  const fallback = useCallback(
    (text: string, note: string) => {
      const intent = matchLocalIntent(text)
      if (intent) {
        setExchange({ transcript: text, reply: intent.speech, note })
        act(intent.action)
        setState('idle')
      } else {
        setExchange({ transcript: text, note })
        setState('error')
      }
    },
    [act],
  )

  const send = useCallback(
    async (body: FormData | { text: string }) => {
      setState('thinking')
      const isForm = body instanceof FormData
      const text = isForm ? '' : body.text
      if (!configured) {
        fallback(text, 'voice brain not deployed yet — keyword navigation only')
        return
      }
      try {
        const res = await fetch(`${VOICE_PROXY_URL}/voice`, {
          method: 'POST',
          ...(isForm
            ? { body }
            : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
        })
        if (!res.ok) {
          fallback(
            text,
            res.status === 429
              ? 'the daimon is catching its breath — try again in a minute'
              : `guide hit a snag (${res.status}) — navigating locally`,
          )
          return
        }
        await handleResponse(await res.json())
      } catch {
        fallback(text, 'guide unreachable — navigating locally')
      }
    },
    [configured, fallback, handleResponse],
  )

  const stopListening = useCallback(() => {
    window.clearTimeout(stopTimerRef.current)
    recorderRef.current?.state === 'recording' && recorderRef.current.stop()
  }, [])

  const startListening = useCallback(async () => {
    ensureCtx()
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setExchange({ note: 'mic permission denied — type your question instead' })
      setState('error')
      return
    }
    streamRef.current = stream
    const ctx = ensureCtx()
    const micSource = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    micSource.connect(analyser)
    analyserRef.current = analyser
    meter()

    const mime = pickMime()
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
    const chunks: Blob[] = []
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    rec.onstop = () => {
      stopMeter()
      releaseMic()
      const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' })
      if (blob.size < 2000) {
        setState('idle')
        return
      }
      const form = new FormData()
      form.append('audio', blob, `speech.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`)
      void send(form)
    }
    recorderRef.current = rec
    rec.start()
    setState('listening')
    stopTimerRef.current = window.setTimeout(stopListening, MAX_RECORD_MS)
  }, [ensureCtx, meter, releaseMic, send, stopListening, stopMeter])

  /** Main orb tap: idle→listen, listening→send, speaking→interrupt. */
  const toggle = useCallback(() => {
    if (state === 'listening') {
      stopListening()
    } else if (state === 'speaking') {
      stopPlayback()
      setState('idle')
    } else if (state === 'idle' || state === 'error') {
      void startListening()
    }
  }, [state, startListening, stopListening, stopPlayback])

  const ask = useCallback(
    (text: string) => {
      const clean = text.trim()
      if (!clean) return
      ensureCtx()
      stopPlayback()
      void send({ text: clean })
    },
    [ensureCtx, send, stopPlayback],
  )

  useEffect(
    () => () => {
      stopPlayback()
      releaseMic()
      window.clearTimeout(stopTimerRef.current)
    },
    [stopPlayback, releaseMic],
  )

  return { state, exchange, levelRef, toggle, ask, configured }
}
