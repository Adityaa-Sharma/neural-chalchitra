import { Suspense, lazy, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

import { GrainOverlay } from './components/GrainOverlay'
import { FilmProgress } from './components/FilmProgress'
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion'

import { TitleCard } from './scenes/TitleCard'

gsap.registerPlugin(ScrollTrigger)

/* Every scene below the fold is its own chunk — KaTeX, Mafs and friends
   only download when the film actually reaches them. */
const Scene1Math = lazy(() =>
  import('./scenes/Scene1Math').then((m) => ({ default: m.Scene1Math })),
)
const Scene2Attention = lazy(() =>
  import('./scenes/Scene2Attention').then((m) => ({ default: m.Scene2Attention })),
)
const Scene3Agent = lazy(() =>
  import('./scenes/Scene3Agent').then((m) => ({ default: m.Scene3Agent })),
)
const Scene4MachineRoom = lazy(() =>
  import('./scenes/Scene4MachineRoom').then((m) => ({ default: m.Scene4MachineRoom })),
)
const Credits = lazy(() => import('./scenes/Credits').then((m) => ({ default: m.Credits })))

function SceneFallback() {
  return <div className="scene" aria-hidden="true" />
}

function App() {
  const reducedMotion = usePrefersReducedMotion()

  // Lenis drives smooth scroll; GSAP's ticker drives Lenis so that
  // ScrollTrigger and scroll position always agree on the same clock.
  useEffect(() => {
    if (reducedMotion) return

    const lenis = new Lenis({ autoRaf: false })
    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [reducedMotion])

  // lazy chunks change the page height as they land — recompute trigger positions
  useEffect(() => {
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 900)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <>
      <FilmProgress />
      <main>
        <TitleCard />
        <Suspense fallback={<SceneFallback />}>
          <Scene1Math />
          <Scene2Attention />
          <Scene3Agent />
          <Scene4MachineRoom />
          <Credits />
        </Suspense>
      </main>
      <GrainOverlay />
    </>
  )
}

export default App
