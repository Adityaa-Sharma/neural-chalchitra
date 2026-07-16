import { useState, type FormEvent } from 'react'
import { DaimonAvatar } from './DaimonAvatar'
import { useVoiceGuide } from './useVoiceGuide'
import './VoiceGuide.css'

const STATUS: Record<string, string> = {
  idle: 'at your service',
  listening: 'listening… tap the mic to send',
  thinking: 'consulting the reels… a few seconds',
  speaking: 'speaking — tap the mic to hush',
  error: 'hmm — try typing instead',
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

/** The guiding spirit of the site — docket-style panel: the daimon avatar
 *  lives inside the chat, animating with every state; the orb just opens it. */
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
            <button
              className="vg-face"
              onClick={toggle}
              aria-label={state === 'listening' ? 'stop and send' : 'talk to the daimon'}
            >
              <DaimonAvatar state={state} levelRef={levelRef} size={46} />
            </button>
            <div className="vg-id">
              <span className="vg-name">daimon · दैमन</span>
              <span className={`vg-status vg-status-${state}`} aria-live="polite">
                {state === 'error' && exchange.note ? exchange.note : STATUS[state]}
              </span>
            </div>
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
            {state === 'thinking' && (
              <p className="vg-reply vg-thinking">
                <span>daimon</span>
                <i className="vg-dot" />
                <i className="vg-dot" />
                <i className="vg-dot" />
              </p>
            )}
            {exchange.reply && state !== 'thinking' && (
              <p className="vg-reply">
                <span>daimon</span> {exchange.reply}
              </p>
            )}
            {exchange.note && state !== 'error' && <p className="vg-note">{exchange.note}</p>}
          </div>

          <form className="vg-input" onSubmit={submit}>
            <button
              type="button"
              className={`vg-mic vg-mic-${state}`}
              onClick={toggle}
              aria-label={
                state === 'listening'
                  ? 'stop recording and send'
                  : state === 'speaking'
                    ? 'stop speaking'
                    : 'record a question'
              }
            >
              <MicIcon />
            </button>
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="type to the daimon…"
              aria-label="ask the guide"
            />
            <button type="submit" className="vg-ask" disabled={!draft.trim()}>
              ask
            </button>
          </form>
        </div>
      )}

      <button
        className="vg-orb"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'close the voice guide' : 'open the voice guide'}
      >
        <DaimonAvatar state={state} levelRef={levelRef} />
      </button>
    </div>
  )
}
