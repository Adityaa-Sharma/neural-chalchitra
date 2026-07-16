import { useEffect, useRef, useState } from 'react'
import { DaimonAvatar } from './DaimonAvatar'
import { useVoiceGuide } from './useVoiceGuide'
import './VoiceGuide.css'

const STATUS: Record<string, string> = {
  idle: 'tap to talk to me',
  listening: 'listening…',
  thinking: 'thinking…',
  speaking: 'speaking…',
  error: 'tap to try again',
}

export function VoiceGuide() {
  const { state, exchange, levelRef, start, toggle, end, configured } = useVoiceGuide()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const armedRef = useRef(false)

  // surge the launcher in after the hero settles
  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 1500)
    return () => window.clearTimeout(t)
  }, [])

  // start the moment the visitor first interacts anywhere (browsers require a
  // gesture before audio/mic) — this is how Aditya "greets you on arrival"
  useEffect(() => {
    const first = () => {
      if (armedRef.current) return
      armedRef.current = true
      window.removeEventListener('pointerdown', first)
      window.removeEventListener('keydown', first)
      setOpen(true)
      void start()
    }
    window.addEventListener('pointerdown', first, { once: false })
    window.addEventListener('keydown', first, { once: false })
    return () => {
      window.removeEventListener('pointerdown', first)
      window.removeEventListener('keydown', first)
    }
  }, [start])

  const openPanel = () => {
    armedRef.current = true
    setOpen(true)
    void start()
  }

  const closePanel = () => {
    end()
    setOpen(false)
  }

  return (
    <div className={`voice-guide ${mounted ? 'is-mounted' : ''} ${open ? 'is-open' : ''}`}>
      {open ? (
        <div className="vg-stage" role="dialog" aria-label="talk to Aditya">
          <button className="vg-x" onClick={closePanel} aria-label="close">
            ×
          </button>

          <button
            className={`vg-orb-big vg-orb-${state}`}
            onClick={toggle}
            aria-label={STATUS[state]}
          >
            <DaimonAvatar state={state} levelRef={levelRef} size={104} />
          </button>

          <p className={`vg-state vg-state-${state}`} aria-live="polite">
            {STATUS[state]}
          </p>

          <div className="vg-captions">
            {exchange.question && (
              <p className="vg-cap-you">&ldquo;{exchange.question}&rdquo;</p>
            )}
            {exchange.reply && <p className="vg-cap-me">{exchange.reply}</p>}
            {exchange.note && <p className="vg-cap-note">{exchange.note}</p>}
            {!exchange.question && !exchange.reply && !exchange.note && (
              <p className="vg-cap-note">
                {configured
                  ? 'Ask me about the math, the transformer, the agent, or the machine room.'
                  : 'voice is warming up — deploy the worker to hear me'}
              </p>
            )}
          </div>
        </div>
      ) : (
        <button className="vg-launch" onClick={openPanel} aria-label="talk to Aditya">
          <DaimonAvatar state={state} levelRef={levelRef} size={54} />
          <span className="vg-launch-label">talk to me</span>
        </button>
      )}
    </div>
  )
}
