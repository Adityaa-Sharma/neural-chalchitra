import { useEffect, useRef, useState, type FormEvent } from 'react'
import { DaimonAvatar } from './DaimonAvatar'
import { useVoiceGuide } from './useVoiceGuide'
import './VoiceGuide.css'

const STATUS: Record<string, string> = {
  idle: 'ask me anything',
  thinking: 'consulting the reels…',
  speaking: 'speaking — tap to hush',
  error: 'hmm — try again',
}

const SUGGESTIONS = ['Show me the RL agent', 'What did he ship?', 'Tell me about the math']

const GREETING_KEY = 'daimon-greeted'

export function VoiceGuide() {
  const { state, exchange, levelRef, ask, stopSpeaking, configured } = useVoiceGuide()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [greeting, setGreeting] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const logRef = useRef<HTMLDivElement>(null)

  // surge in after the hero settles; offer the greeting once per visitor
  useEffect(() => {
    const t1 = window.setTimeout(() => setMounted(true), 1600)
    let t2 = 0
    try {
      if (!localStorage.getItem(GREETING_KEY)) {
        t2 = window.setTimeout(() => setGreeting(true), 3600)
      }
    } catch {
      /* private mode — skip greeting */
    }
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  // keep the newest message in view
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [exchange, state])

  const dismissGreeting = () => {
    setGreeting(false)
    try {
      localStorage.setItem(GREETING_KEY, '1')
    } catch {
      /* noop */
    }
  }

  const openPanel = () => {
    dismissGreeting()
    setOpen(true)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return
    void ask(draft)
    setDraft('')
  }

  const shoot = (q: string) => {
    setDraft('')
    void ask(q)
  }

  return (
    <div className={`voice-guide ${mounted ? 'is-mounted' : ''} ${open ? 'is-open' : ''}`}>
      {/* ————— open chat panel ————— */}
      {open && (
        <div className="vg-panel" role="dialog" aria-label="the daimon, a voice guide">
          <div className="vg-head">
            <button
              className="vg-face"
              onClick={state === 'speaking' ? stopSpeaking : undefined}
              aria-label={state === 'speaking' ? 'stop speaking' : 'the daimon'}
            >
              <DaimonAvatar state={state} levelRef={levelRef} size={44} />
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

          <div className="vg-log" ref={logRef} aria-live="polite">
            {!exchange.question && (
              <p className="vg-intro">
                I am the resident spirit of this film. Ask me about Aditya — the math, the
                transformer, the Breakout agent, the machine room — and I&rsquo;ll take you there.
                {!configured && (
                  <span className="vg-note">(voice warming up — keyword navigation for now)</span>
                )}
              </p>
            )}
            {exchange.question && (
              <p className="vg-you">
                <span>you</span> {exchange.question}
              </p>
            )}
            {state === 'thinking' && (
              <p className="vg-reply vg-typing">
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

          {!exchange.question && (
            <div className="vg-suggest">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => shoot(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <form className="vg-input" onSubmit={submit}>
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="ask the daimon…"
              aria-label="ask the guide"
            />
            <button type="submit" className="vg-send" disabled={!draft.trim()} aria-label="send">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M4 12h14M12 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* ————— greeting bubble (once per visitor) ————— */}
      {!open && greeting && (
        <div className="vg-greeting" role="status">
          <button className="vg-greeting-x" onClick={dismissGreeting} aria-label="dismiss">
            ×
          </button>
          <p onClick={openPanel}>
            <strong>Meet the daimon.</strong> Ask me anything about Aditya — I&rsquo;ll speak, and
            walk you through the film.
          </p>
        </div>
      )}

      {/* ————— launcher ————— */}
      {!open && (
        <button className="vg-launch" onClick={openPanel} aria-label="talk to the daimon">
          <DaimonAvatar state={state} levelRef={levelRef} size={54} />
          <span className="vg-launch-label">talk to the daimon</span>
        </button>
      )}
    </div>
  )
}
