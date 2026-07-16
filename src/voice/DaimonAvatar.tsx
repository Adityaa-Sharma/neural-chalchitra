import { useEffect, useRef, useState, type RefObject } from 'react'
import type { VoiceState } from './useVoiceGuide'
import { asset } from '../lib/asset'
import './DaimonAvatar.css'

interface DaimonAvatarProps {
  state: VoiceState
  /** live audio level 0..1 — mic while listening, TTS while speaking */
  levelRef: RefObject<number>
  size?: number
}

/** Aditya's voice avatar. If public/me.jpg exists it shows his face ringed by a
 *  reactive glow; otherwise an ember-spirit orb with blinking eyes. Either way
 *  it breathes, listens, and pulses with the audio. Pure CSS/SVG. */
export function DaimonAvatar({ state, levelRef, size = 56 }: DaimonAvatarProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [hasPhoto, setHasPhoto] = useState(false)

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
    <div
      className={`daimon daimon-${state} ${hasPhoto ? 'has-photo' : ''}`}
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
        <img
          className="daimon-photo"
          src={asset('assets/me.jpeg')}
          alt=""
          onLoad={() => setHasPhoto(true)}
          onError={() => setHasPhoto(false)}
        />
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
