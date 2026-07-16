import { useState, type FormEvent } from 'react'
import { DaimonAvatar } from './DaimonAvatar'
import { useVoiceGuide } from './useVoiceGuide'
import './VoiceGuide.css'

const HINTS: Record<string, string> = {
  idle: 'tap to talk to the daimon',
  listening: 'listening… tap to send',
  thinking: 'consulting the reels…',
  speaking: 'tap to interrupt',
  error: 'try typing instead',
}

/** The guiding spirit of the site: a floating daimon that listens (Sarvam STT),
 *  answers about Aditya (Sarvam chat), speaks with an Indian voice (Sarvam TTS)
 *  and walks you to the right scene. Degrades to typed keyword navigation
 *  when the proxy isn't deployed. */
export function VoiceGuide() {
  const { state, exchange, levelRef, toggle, ask, configured } = useVoiceGuide()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    ask(draft)
    setDraft('')
  }

  return (
    <div className={`voice-guide ${open ? 'is-open' : ''}`}>
      {open && (
        <div className="vg-panel" role="dialog" aria-label="voice guide">
          <div className="vg-head">
            <span className="vg-name">daimon · दैमन</span>
            <button className="vg-close" onClick={() => setOpen(false)} aria-label="close guide">
              ×
            </button>
          </div>

          <div className="vg-log" aria-live="polite">
            {!exchange.transcript && !exchange.reply && (
              <p className="vg-intro">
                I am the resident spirit of this film. Ask me about Aditya — his math, his
                transformer, the Breakout agent, the machine room — or just say{' '}
                <em>&ldquo;show me the agent.&rdquo;</em>
                {!configured && (
                  <span className="vg-note">
                    (voice is warming up — for now I navigate on typed keywords)
                  </span>
                )}
              </p>
            )}
            {exchange.transcript && (
              <p className="vg-you">
                <span>you</span> {exchange.transcript}
              </p>
            )}
            {exchange.reply && (
              <p className="vg-reply">
                <span>daimon</span> {exchange.reply}
              </p>
            )}
            {exchange.note && <p className="vg-note">{exchange.note}</p>}
          </div>

          <form className="vg-input" onSubmit={submit}>
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="type to the daimon…"
              aria-label="ask the guide"
            />
            <button type="submit" disabled={!draft.trim()}>
              ask
            </button>
          </form>

          <p className="vg-hint">{HINTS[state]}</p>
        </div>
      )}

      <button
        className="vg-orb"
        onClick={() => {
          if (!open) {
            setOpen(true)
            return
          }
          toggle()
        }}
        aria-label={open ? HINTS[state] : 'open the voice guide'}
      >
        <DaimonAvatar state={state} levelRef={levelRef} />
      </button>
    </div>
  )
}
