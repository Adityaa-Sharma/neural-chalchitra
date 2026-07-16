import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import './FilmProgress.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/** Thin gold bar at the top of the screen: the film reel advancing. */
export function FilmProgress() {
  const barRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.to(barRef.current, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        start: 0,
        end: 'max',
        scrub: 0.3,
      },
    })
  })

  return (
    <div className="film-progress" aria-hidden="true">
      <div className="film-progress-bar" ref={barRef} />
    </div>
  )
}
