import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import './TitleCard.css'

gsap.registerPlugin(useGSAP)

const SCENES = [
  { n: '01', title: 'The Plane', href: '#plane' },
  { n: '02', title: 'End Credits', href: '#credits' },
]

export function TitleCard() {
  const rootRef = useRef<HTMLElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useGSAP(
    () => {
      if (reducedMotion) return
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('.title-eyebrow', { y: 24, opacity: 0, duration: 0.7, delay: 0.2 })
        .from('.title-deva', { y: 30, opacity: 0, duration: 0.8 }, '-=0.4')
        .from('.title-main', { y: 40, opacity: 0, duration: 0.9 }, '-=0.5')
        .from('.title-sub', { y: 20, opacity: 0, duration: 0.7 }, '-=0.5')
        .from('.title-tagline', { y: 20, opacity: 0, duration: 0.7 }, '-=0.45')
        .from('.title-index li', { y: 16, opacity: 0, stagger: 0.09, duration: 0.5 }, '-=0.35')
        .from('.title-cue', { opacity: 0, duration: 0.9 }, '-=0.1')
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  )

  return (
    <section className="scene title-card" id="title" ref={rootRef}>
      <div className="scene-inner title-inner">
        <p className="title-eyebrow">अब प्रदर्शित · now showing</p>

        <p className="title-deva" lang="hi">
          न्यूरल चलचित्र
        </p>
        <h1 className="title-main">
          Neural
          <br />
          Chalchitra
        </h1>

        <p className="title-sub">
          <em>chalchitra</em> (चलचित्र) — <span>a moving picture.</span>
          <br />
          The journey of <strong>Aditya Sharma</strong>, mapped on one plane.
        </p>

        <p className="title-tagline">
          I derive the math, build the model, train the agent, and ship the system.
        </p>

        <ol className="title-index">
          {SCENES.map((s) => (
            <li key={s.n}>
              <a href={s.href}>
                <span className="index-n">{s.n}</span>
                {s.title}
              </a>
            </li>
          ))}
        </ol>

        <p className="title-cue" aria-hidden="true">
          scroll to roll film <span className="cue-arrow">↓</span>
        </p>
      </div>
    </section>
  )
}
