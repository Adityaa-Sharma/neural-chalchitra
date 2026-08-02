import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { LogoStrip } from '../components/LogoStrip'
import { asset } from '../lib/asset'
import './TitleCard.css'

gsap.registerPlugin(useGSAP)

const SCENES = [
  { n: '01', title: 'The Work', href: '#plane' },
  { n: '02', title: 'Credits', href: '#credits' },
]

/* The four numbers a reviewer will spend their time verifying — shown before
 * anything asks for their patience. Values are facts from shipped systems. */
const PROOF = [
  { value: '< 4 s', label: 'agent latency · 8 tools · 16k ctx' },
  { value: '100+', label: 'concurrent users · 4×A100' },
  { value: '10,000', label: 'leases extracted · Ray' },
  { value: '14B', label: 'Qwen3 fine-tune · past closed models' },
]

/* Scannability rule (owner's spec): who / what / where readable in the first
 * second, the whole hero in three. One quick fade only — no staggered
 * entrances standing between a decision-maker and the content. */
export function TitleCard() {
  const rootRef = useRef<HTMLElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useGSAP(
    () => {
      if (reducedMotion) return
      gsap.from('.title-inner', { opacity: 0, y: 12, duration: 0.45, ease: 'power2.out' })
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

        <p className="title-role">Senior AI Engineer · Savills APAC</p>

        <p className="title-position">I build agent systems that survive production.</p>

        <p className="title-sub">
          Savills was my client at Datasmith — then they hired me. Mathematics degree first;
          agents since 2024, before the hype.
        </p>

        <ul className="title-proof" aria-label="headline numbers">
          {PROOF.map((p) => (
            <li key={p.label}>
              <span className="proof-value">{p.value}</span>
              <span className="proof-label">{p.label}</span>
            </li>
          ))}
        </ul>

        <div className="title-cta">
          <a className="cta-main" href="mailto:mailmeifyoucan7@gmail.com">
            email me
          </a>
          <a href={asset('Aditya_Sharma_Resume.pdf')} target="_blank" rel="noreferrer">
            resume.pdf
          </a>
          <a href="https://github.com/Adityaa-Sharma" target="_blank" rel="noreferrer">
            github
          </a>
        </div>

        <div className="title-logos">
          <LogoStrip />
        </div>

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
