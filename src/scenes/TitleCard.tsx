import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import './TitleCard.css'

gsap.registerPlugin(useGSAP)

const SCENES = [
  { n: '01', title: 'The Work', href: '#plane' },
  { n: '02', title: 'Credits', href: '#credits' },
]

/* The four numbers a reviewer will spend their time verifying — shown before
 * anything asks for their patience. Values are facts from shipped systems. */
const PROOF = [
  { value: '< 4 s', label: '8-tool agent latency, 16k context' },
  { value: '100+', label: 'concurrent users on 4×A100' },
  { value: '10,000', label: 'leases batch-extracted with Ray' },
  { value: '14B', label: 'Qwen3 fine-tune, past closed models on tables' },
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
        .from('.title-main', { y: 40, opacity: 0, duration: 0.9 }, '-=0.4')
        .from('.title-position', { y: 24, opacity: 0, duration: 0.8 }, '-=0.5')
        .from('.title-sub', { y: 20, opacity: 0, duration: 0.7 }, '-=0.5')
        .from('.title-proof li', { y: 18, opacity: 0, stagger: 0.08, duration: 0.5 }, '-=0.4')
        .from('.title-index li', { y: 16, opacity: 0, stagger: 0.09, duration: 0.5 }, '-=0.3')
        .from('.title-cue', { opacity: 0, duration: 0.9 }, '-=0.1')
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  )

  return (
    <section className="scene title-card" id="title" ref={rootRef}>
      <div className="scene-inner title-inner">
        <p className="title-eyebrow" lang="hi">
          न्यूरल चलचित्र <span>· neural chalchitra</span>
        </p>

        <h1 className="title-main">Aditya Sharma</h1>

        <p className="title-position">I build agent systems that survive production.</p>

        <p className="title-sub">
          Senior AI Engineer at <strong>Savills APAC</strong> — the client I served at Datasmith,
          until they hired me. Mathematics degree first; agents since 2024, before the hype.
        </p>

        <ul className="title-proof" aria-label="headline numbers">
          {PROOF.map((p) => (
            <li key={p.label}>
              <span className="proof-value">{p.value}</span>
              <span className="proof-label">{p.label}</span>
            </li>
          ))}
        </ul>

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
          scroll <span className="cue-arrow">↓</span>
        </p>
      </div>
    </section>
  )
}
