import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import './ComplexityBars.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/* For a 256-token context: full attention shakes every hand (256² = 65,536);
   Linformer projects K,V down to 64 rows first (256 × 64 = 16,384). */
const FULL = 256 * 256
const LINF = 256 * 64

export function ComplexityBars() {
  const rootRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useGSAP(
    () => {
      if (reducedMotion) return
      const counters = gsap.utils.toArray<HTMLElement>('.cx-count')
      const tl = gsap.timeline({
        scrollTrigger: { trigger: rootRef.current, start: 'top 78%', once: true },
        defaults: { ease: 'expo.out', duration: 1.2 },
      })
      tl.from('.cx-bar-fill', { scaleX: 0, transformOrigin: 'left center', stagger: 0.15 })
      for (const el of counters) {
        const target = Number(el.dataset.value)
        const obj = { n: 0 }
        tl.to(
          obj,
          {
            n: target,
            duration: 1.2,
            ease: 'expo.out',
            onUpdate: () => {
              el.textContent = Math.round(obj.n).toLocaleString('en-IN')
            },
          },
          '<',
        )
      }
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  )

  return (
    <figure className="complexity" ref={rootRef}>
      <div className="cx-row">
        <span className="cx-label">full attention</span>
        <div className="cx-bar">
          <div className="cx-bar-fill cx-full" style={{ width: '100%' }} />
        </div>
        <span className="cx-count c-red" data-value={FULL}>
          {FULL.toLocaleString('en-IN')}
        </span>
      </div>
      <div className="cx-row">
        <span className="cx-label">linformer</span>
        <div className="cx-bar">
          <div className="cx-bar-fill cx-linf" style={{ width: `${(LINF / FULL) * 100}%` }} />
        </div>
        <span className="cx-count c-teal" data-value={LINF}>
          {LINF.toLocaleString('en-IN')}
        </span>
      </div>
      <figcaption>
        Handshakes per forward pass, for a 256-token context. Project the keys and values through
        a thin bottleneck first, and attention&rsquo;s cost stops growing with the square of the
        sequence — that was the paper&rsquo;s bet, and my training curves agreed.
      </figcaption>
    </figure>
  )
}
