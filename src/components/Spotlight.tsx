import { useEffect, useRef } from 'react'
import './Spotlight.css'

/** A cinema follow-spot: a soft radial glow that trails the cursor across the
 *  dark house. Desktop fine-pointers only; invisible on touch. */
export function Spotlight() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const el = ref.current
    if (!el) return
    let raf = 0
    let tx = -1000
    let ty = -1000
    const onMove = (e: MouseEvent) => {
      tx = e.clientX
      ty = e.clientY
      if (!raf) {
        raf = requestAnimationFrame(() => {
          el.style.setProperty('--sx', `${tx}px`)
          el.style.setProperty('--sy', `${ty}px`)
          raf = 0
        })
      }
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return <div className="spotlight" ref={ref} aria-hidden="true" />
}
