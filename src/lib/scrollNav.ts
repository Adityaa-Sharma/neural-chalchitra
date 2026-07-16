import type Lenis from 'lenis'

let lenis: Lenis | null = null

/** App registers its Lenis instance so programmatic scrolls share the same
 *  smooth-scroll pipeline (falls back to native when reduce-motion disables Lenis). */
export function registerLenis(instance: Lenis | null) {
  lenis = instance
}

export function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) {
    lenis.scrollTo(el, { offset: 0, duration: 1.4 })
  } else {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
