import { useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { Eq } from '../../components/Eq'
import './AttentionFormula.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const FORMULA = String.raw`\operatorname{Attention}(Q,K,V)=\htmlClass{t-soft}{\operatorname{softmax}}\!\left(\frac{\htmlClass{t-q}{Q}\,\htmlClass{t-k}{K^{\top}}}{\htmlClass{t-scale}{\sqrt{d_k}}}\right)\htmlClass{t-v}{V}`

const STEPS = [
  {
    key: 'q',
    heading: 'Every token asks a question.',
    body: 'Q — the query. Each embedding is projected into "what am I looking for?" For a character in a poem, that might be: who opened the quote I am inside of?',
  },
  {
    key: 'k',
    heading: 'Every token advertises an answer.',
    body: 'K — the key. The dot product QKᵀ scores every pairing at once: one matrix multiply, N×N conversations. This is the all-pairs handshake I implemented from the 2017 paper.',
  },
  {
    key: 'scale',
    heading: 'Scores are tamed…',
    body: '÷√dₖ keeps dot products from exploding as dimensions grow, and softmax turns them into a probability distribution — every row sums to one. Attention is literally a weighted average.',
  },
  {
    key: 'v',
    heading: '…and value flows.',
    body: 'V — the payload. Each token walks away with a mixture of everyone else, weighted by relevance. Stack 12 heads × 12 layers of this, and my 21.77M-parameter model learns to write verse.',
  },
] as const

export function AttentionFormula() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<string>('none')
  const reducedMotion = usePrefersReducedMotion()

  useGSAP(
    () => {
      if (reducedMotion) return
      const steps = gsap.utils.toArray<HTMLElement>('.attn-step')
      for (const step of steps) {
        ScrollTrigger.create({
          trigger: step,
          start: 'top 62%',
          end: 'bottom 62%',
          onToggle: (self) => {
            if (self.isActive) setActive(step.dataset.term ?? 'none')
          },
        })
      }
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  )

  return (
    <div
      className="attn-formula-block"
      ref={rootRef}
      data-active={reducedMotion ? 'all' : active}
    >
      <div className="attn-sticky">
        <Eq display tex={FORMULA} className="attn-formula" />
      </div>

      <div className="attn-steps">
        {STEPS.map((s) => (
          <div className="attn-step" data-term={s.key} key={s.key}>
            <h3>{s.heading}</h3>
            <p>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
