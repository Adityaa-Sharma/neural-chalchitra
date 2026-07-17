import { Suspense, lazy, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

import { GrainOverlay } from './components/GrainOverlay'
import { FilmProgress } from './components/FilmProgress'
import { Spotlight } from './components/Spotlight'
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion'
import { useGlowCards } from './hooks/useGlowCards'
import { registerLenis } from './lib/scrollNav'
import { VoiceGuide } from './voice/VoiceGuide'

import { TitleCard } from './scenes/TitleCard'

gsap.registerPlugin(ScrollTrigger)

/* Below-fold acts are separate chunks — KaTeX and friends only download
   when the film actually reaches them. */
const ThePlane = lazy(() => import('./plane/ThePlane').then((m) => ({ default: m.ThePlane })))
const Credits = lazy(() => import('./scenes/Credits').then((m) => ({ default: m.Credits })))

function SceneFallback() {
  return <div className="scene" aria-hidden="true" />
}

/* Mounts only after every lazy scene has resolved (it sits last inside the
   Suspense boundary), so trigger positions are recomputed against the real
   page height — again once the webfonts settle. */
function RefreshTriggers() {
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      ScrollTrigger.refresh()
      // lazy sections exist only now — honor a plain #section deep link
      const id = window.location.hash.slice(1)
      if (id && !id.includes('=')) {
        document.getElementById(id)?.scrollIntoView({ block: 'start' })
      }
    })
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(raf)
  }, [])
  return null
}

function App() {
  const reducedMotion = usePrefersReducedMotion()
  useGlowCards()

  // Lenis drives smooth scroll; GSAP's ticker drives Lenis so that
  // ScrollTrigger and scroll position always agree on the same clock.
  useEffect(() => {
    if (reducedMotion) return

    const lenis = new Lenis({ autoRaf: false })
    lenis.on('scroll', ScrollTrigger.update)
    registerLenis(lenis)

    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      registerLenis(null)
      lenis.destroy()
    }
  }, [reducedMotion])

  return (
    <>
      <FilmProgress />
      <main>
        <TitleCard />
        <Suspense fallback={<SceneFallback />}>
          <ThePlane />
          <Credits />
          <RefreshTriggers />
        </Suspense>
      </main>
      <Spotlight />
      <GrainOverlay />
      <VoiceGuide />
    </>
  )
}

export default App
