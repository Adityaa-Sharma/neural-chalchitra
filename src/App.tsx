import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

import { GrainOverlay } from './components/GrainOverlay'
import { FilmProgress } from './components/FilmProgress'
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion'

import { TitleCard } from './scenes/TitleCard'
import { Scene1Math } from './scenes/Scene1Math'
import { Scene2Attention } from './scenes/Scene2Attention'
import { Scene3Agent } from './scenes/Scene3Agent'
import { Scene4MachineRoom } from './scenes/Scene4MachineRoom'
import { Credits } from './scenes/Credits'

gsap.registerPlugin(ScrollTrigger)

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

  return (
    <>
      <FilmProgress />
      <main>
        <TitleCard />
        <Scene1Math />
        <Scene2Attention />
        <Scene3Agent />
        <Scene4MachineRoom />
        <Credits />
      </main>
      <GrainOverlay />
    </>
  )
}

export default App
