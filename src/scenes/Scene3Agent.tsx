import { Reveal } from '../components/Reveal'
import { RevealTitle } from '../components/RevealTitle'
import { asset } from '../lib/asset'
import { BellmanMorph } from './scene3/BellmanMorph'
import { EpsilonDecay } from './scene3/EpsilonDecay'
import './Scene3Agent.css'

const DQN_SPEC = [
  ['replay buffer', '1,000,000 transitions'],
  ['batch size', '32'],
  ['learning rate', '6.25 × 10⁻⁵'],
  ['discount γ', '0.99'],
  ['ε schedule', '1.0 → 0.1 over 250k steps'],
  ['target net sync', 'every 10,000 steps'],
  ['input', '4 × 84 × 84 stacked grayscale'],
  ['loss / optimizer', 'Huber / RMSProp'],
  ['training', '~1,600 episodes'],
] as const

export function Scene3Agent() {
  return (
    <section className="scene" id="agent">
      <div className="scene-inner">
        <Reveal className="slate">
          <strong>Scene 03</strong> The Agent · कर्ता
        </Reveal>

        <RevealTitle className="scene-title">
          Then the model stopped predicting, and started acting.
        </RevealTitle>

        <Reveal as="p" className="prose">
          A poet model answers <em>&ldquo;what comes next?&rdquo;</em> An agent answers{' '}
          <em>&ldquo;what should I do next?&rdquo;</em> — and the world answers back with a
          reward. I implemented <strong>Playing Atari with Deep Reinforcement Learning</strong>{' '}
          (DeepMind, 2013) from the paper: one convolutional network, pixels in, action values
          out. The math is older than the hardware:
        </Reveal>

        <BellmanMorph />

        <Reveal as="p" className="prose">
          Learning it demands two tricks: a <strong>replay buffer</strong> — the 2013
          paper&rsquo;s move — a million remembered transitions, sampled at random to break
          correlation; and the frozen <strong>target network</strong> DeepMind added in the 2015{' '}
          <em>Nature</em> follow-up — chasing a target that moves with you never converges. My
          implementation uses both. Plus one philosophical dial:
        </Reveal>

        <Reveal>
          <EpsilonDecay />
        </Reveal>

        <div className="agent-showcase">
          <Reveal as="figure" className="arcade">
            <div className="arcade-screen">
              <img
                src={asset('assets/dqn/DQN_Agent.gif')}
                alt="The trained DQN agent playing Atari Breakout"
                width={160}
                height={210}
              />
            </div>
            <figcaption>
              Not a stock gif — <strong>my agent</strong>, after ~1,600 episodes.{' '}
              <a href="https://github.com/Adityaa-Sharma/DeepQlearning" target="_blank" rel="noreferrer">
                DeepQlearning ↗
              </a>
            </figcaption>
          </Reveal>

          <Reveal as="dl" className="spec-card glow-card" delay={0.12}>
            <div className="spec-card-title">breakout.pth — training card</div>
            {DQN_SPEC.map(([k, v]) => (
              <div className="spec-item" key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </Reveal>
        </div>

        <div className="spec-row">
          <Reveal as="figure" className="plot-card glow-card">
            <img
              src={asset('assets/dqn/training_metrics.png')}
              alt="DQN training metrics: loss, reward, Q-values, epsilon"
              loading="lazy"
              width={3000}
              height={4500}
            />
            <figcaption>Training: Huber loss, reward per episode, mean Q, ε decay.</figcaption>
          </Reveal>
          <Reveal as="figure" className="plot-card glow-card" delay={0.12}>
            <img
              src={asset('assets/dqn/evaluation_metrics.png')}
              alt="DQN evaluation metrics"
              loading="lazy"
              width={3000}
              height={3000}
            />
            <figcaption>Evaluation: the action values learned to mean something.</figcaption>
          </Reveal>
        </div>

        <Reveal as="p" className="prose scene-beat">
          An agent that plays in a notebook is a demo. To matter, models have to{' '}
          <strong>serve</strong> — reliably, in parallel, for real people. Final scene: the
          machine room.
        </Reveal>
      </div>
    </section>
  )
}
