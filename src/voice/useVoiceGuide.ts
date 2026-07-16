import { useCallback, useEffect, useRef, useState } from 'react'
import { VOICE_PROXY_URL, matchLocalIntent } from './voiceConfig'
import { scrollToSection } from '../lib/scrollNav'

export type VoiceState = 'idle' | 'thinking' | 'speaking' | 'error'

export interface Exchange {
  question?: string
  reply?: string
  note?: string
}

/** Typed-input guide: question text → Worker (Sarvam chat + TTS) → spoken,
 *  Indian-voiced reply + a scroll action. No microphone — by design. */
export function useVoiceGuide() {
  const [state, setState] = useState<VoiceState>('idle')
  const [exchange, setExchange] = useState<Exchange>({})
  const levelRef = useRef(0)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef(0)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)

  const configured = VOICE_PROXY_URL.length > 0

  const stopMeter = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    levelRef.current = 0
  }, [])

  const meter = useCallback((analyser: AnalyserNode) => {
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

  /** Create/resume the AudioContext synchronously inside a user gesture —
   *  required for iOS to allow the later TTS playback. */
  const ensureCtx = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
    if (audioCtxRef.current.state === 'suspended') void audioCtxRef.current.resume()
    return audioCtxRef.current
  }, [])

  const stopSpeaking = useCallback(() => {
    try {
      sourceRef.current?.stop()
    } catch {
      /* already stopped */
    }
    sourceRef.current = null
    stopMeter()
    setState('idle')
  }, [stopMeter])

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
      sourceRef.current = src
      src.onended = () => {
        stopMeter()
        onDone()
      }
      src.start()
      meter(analyser)
    },
    [ensureCtx, meter, stopMeter],
  )

  const fallback = useCallback(
    (text: string, note: string) => {
      const intent = matchLocalIntent(text)
      if (intent) {
        setExchange({ question: text, reply: intent.speech, note })
        act(intent.action)
        setState('idle')
      } else {
        setExchange({ question: text, note })
        setState('error')
      }
    },
    [act],
  )

  const ask = useCallback(
    async (text: string) => {
      const question = text.trim().slice(0, 400)
      if (!question || state === 'thinking') return
      ensureCtx() // inside the submit gesture
      try {
        sourceRef.current?.stop()
      } catch {
        /* nothing playing */
      }
      setExchange({ question })
      setState('thinking')

      if (!configured) {
        fallback(question, 'voice brain not deployed yet — keyword navigation only')
        return
      }

      try {
        const res = await fetch(`${VOICE_PROXY_URL}/voice`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text: question }),
        })
        if (!res.ok) {
          fallback(
            question,
            res.status === 429
              ? 'the daimon is catching its breath — try again in a minute'
              : `guide hit a snag (${res.status}) — navigating locally`,
          )
          return
        }
        const payload = await res.json()
        setExchange({ question, reply: payload.speech || undefined })
        act(payload.action)
        if (payload.audio) {
          setState('speaking')
          try {
            await playBase64Wav(payload.audio, () => setState('idle'))
            return
          } catch {
            /* captions still shown */
          }
        }
        setState('idle')
      } catch {
        fallback(question, 'guide unreachable — navigating locally')
      }
    },
    [state, configured, ensureCtx, fallback, act, playBase64Wav],
  )

  useEffect(
    () => () => {
      try {
        sourceRef.current?.stop()
      } catch {
        /* noop */
      }
      cancelAnimationFrame(rafRef.current)
    },
    [],
  )

  return { state, exchange, levelRef, ask, stopSpeaking, configured }
}
