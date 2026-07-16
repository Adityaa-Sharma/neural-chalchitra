import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { Eq } from '../../components/Eq'
import './BellmanMorph.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const BELLMAN = String.raw`Q^{*}(s,a) \;=\; \mathbb{E}\!\left[\, r + \gamma \max_{a'} Q^{*}(s',a') \,\right]`

const DQN_LOSS = String.raw`\mathcal{L}(\theta) \;=\; \mathbb{E}_{(s,a,r,s')\sim \mathcal{D}}\!\Big[\big(\, r + \gamma \max_{a'} Q(s',a';\,\htmlClass{t-target}{\theta^{-}}) - Q(s,a;\,\htmlClass{t-online}{\theta}) \,\big)^{2}\Big]`

/** Bellman's 1957 recursion crossfades into DeepMind's 2013 training loss. */
export function BellmanMorph() {
  const rootRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useGSAP(
    () => {
      if (reducedMotion) return
      gsap
        .timeline({
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top 65%',
            end: 'bottom 45%',
            scrub: 0.5,
          },
          defaults: { ease: 'none' },
        })
        .to('.morph-bellman', { opacity: 0.18, y: -26, filter: 'blur(2px)' })
        .from('.morph-dqn', { opacity: 0, y: 26 }, '<0.15')
        .from('.morph-notes', { opacity: 0 }, '<0.3')
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  )

  return (
    <div className={`bellman-morph ${reducedMotion ? 'is-static' : ''}`} ref={rootRef}>
      <div className="morph-step morph-bellman">
        <span className="morph-tag">1957 · Bellman optimality</span>
        <Eq display tex={BELLMAN} />
      </div>
      <div className="morph-step morph-dqn">
        <span className="morph-tag">2013 · the same idea, as a loss function</span>
        <Eq display tex={DQN_LOSS} />
      </div>
      <div className="morph-notes">
        <span>
          <i className="dot dot-teal" /> <Eq tex="\theta^{-}" /> — frozen target network, synced
          every 10k steps
        </span>
        <span>
          <i className="dot dot-gold" /> <Eq tex="\theta" /> — the network learning right now
        </span>
      </div>
    </div>
  )
}
