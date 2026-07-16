import { useEffect, useRef, type RefObject } from 'react'
import type { VoiceState } from './useVoiceGuide'
import './DaimonAvatar.css'

interface DaimonAvatarProps {
  state: VoiceState
  /** live TTS audio level 0..1, drives the orb's pulse while speaking */
  levelRef: RefObject<number>
  size?: number
}

/** The daimon — an ember-spirit orb. Counter-orbiting gold/teal blobs under a
 *  rotating conic sheen, a molten core, and crisp blinking eyes on top. Motion
 *  is state-driven; audio level scales it while speaking. Pure CSS/SVG. */
export function DaimonAvatar({ state, levelRef, size = 56 }: DaimonAvatarProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const l = levelRef.current ?? 0
      rootRef.current?.style.setProperty('--level', String(l))
      raf = requestAnimationFrame(tick)
    }
    if (state === 'speaking') raf = requestAnimationFrame(tick)
    else rootRef.current?.style.setProperty('--level', '0')
    return () => cancelAnimationFrame(raf)
  }, [state, levelRef])

  return (
    <div
      className={`daimon daimon-${state}`}
      ref={rootRef}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="daimon-aura" />
      <span className="daimon-disc">
        <span className="daimon-sheen" />
        <span className="daimon-blob daimon-blob-gold" />
        <span className="daimon-blob daimon-blob-teal" />
        <span className="daimon-core" />
        <span className="daimon-shimmer" />
        <svg className="daimon-face" viewBox="0 0 64 64">
          <g className="daimon-eyes">
            <g className="daimon-eye">
              <rect x="22" y="26" width="6" height="12" rx="3" />
              <circle className="daimon-catch" cx="24.5" cy="29.5" r="1.1" />
            </g>
            <g className="daimon-eye">
              <rect x="36" y="26" width="6" height="12" rx="3" />
              <circle className="daimon-catch" cx="38.5" cy="29.5" r="1.1" />
            </g>
          </g>
        </svg>
      </span>
    </div>
  )
}
