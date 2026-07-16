import { useEffect } from 'react'

/** One delegated listener drives every .glow-card's cursor-following gradient.
 *  Cheap: a couple of CSS-var writes per mousemove, only on fine pointers. */
export function useGlowCards() {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    const onMove = (e: MouseEvent) => {
      const card = (e.target as Element | null)?.closest?.('.glow-card')
      if (!(card instanceof HTMLElement)) return
      const r = card.getBoundingClientRect()
      card.style.setProperty('--mx', `${e.clientX - r.left}px`)
      card.style.setProperty('--my', `${e.clientY - r.top}px`)
    }

    document.addEventListener('mousemove', onMove, { passive: true })
    return () => document.removeEventListener('mousemove', onMove)
  }, [])
}
