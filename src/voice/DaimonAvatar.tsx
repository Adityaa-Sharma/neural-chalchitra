import { useEffect, useRef, type RefObject } from 'react'
import type { VoiceState } from './useVoiceGuide'
import './DaimonAvatar.css'

interface DaimonAvatarProps {
  state: VoiceState
  /** live audio level 0..1 (mic while listening, TTS while speaking) */
  levelRef: RefObject<number>
  size?: number
}

/** The daimon — the site's guiding spirit, now with a face. A gold orb with
 *  blinking eyes; its ring breathes with whoever is talking. */
export function DaimonAvatar({ state, levelRef, size = 52 }: DaimonAvatarProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  // audio level → CSS var, off-React for 60fps without re-renders
  useEffect(() => {
    let raf = 0
    const tick = () => {
      rootRef.current?.style.setProperty('--level', String(levelRef.current ?? 0))
      raf = requestAnimationFrame(tick)
    }
    if (state === 'listening' || state === 'speaking') raf = requestAnimationFrame(tick)
    else rootRef.current?.style.setProperty('--level', '0')
    return () => cancelAnimationFrame(raf)
  }, [state, levelRef])

  return (
    <div className={`daimon daimon-${state}`} ref={rootRef} style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" aria-hidden="true">
        {/* breathing ring */}
        <circle className="daimon-ring" cx="32" cy="32" r="26" />
        {/* the orb */}
        <circle className="daimon-orb" cx="32" cy="32" r="20" />
        {/* eyes — blink in idle, widen while listening */}
        <g className="daimon-eyes">
          <rect className="daimon-eye" x="23" y="26" width="5" height="10" rx="2.5" />
          <rect className="daimon-eye" x="36" y="26" width="5" height="10" rx="2.5" />
        </g>
        {/* speaking mouth: three bars driven by --level */}
        <g className="daimon-mouth">
          <rect x="24" y="42" width="3.5" height="5" rx="1.75" />
          <rect x="30.25" y="42" width="3.5" height="5" rx="1.75" />
          <rect x="36.5" y="42" width="3.5" height="5" rx="1.75" />
        </g>
        {/* thinking: three orbiting sparks */}
        <g className="daimon-orbit">
          <circle cx="32" cy="6" r="2.4" />
          <circle cx="54.5" cy="45" r="2.4" />
          <circle cx="9.5" cy="45" r="2.4" />
        </g>
      </svg>
    </div>
  )
}
