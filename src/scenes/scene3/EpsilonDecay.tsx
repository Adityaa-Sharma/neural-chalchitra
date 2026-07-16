import './EpsilonDecay.css'

/* The exact schedule from DeepQlearning/configs.py:
   ε linear 1.0 → 0.1 over 250,000 steps, then flat. */
const W = 560
const H = 150
const PAD_L = 44
const PAD_B = 26
const TOTAL_STEPS = 400_000
const DECAY_STEPS = 250_000

const x = (step: number) => PAD_L + (step / TOTAL_STEPS) * (W - PAD_L - 10)
const y = (eps: number) => 12 + (1 - eps) * (H - PAD_B - 12)

export function EpsilonDecay() {
  const path = `M ${x(0)} ${y(1)} L ${x(DECAY_STEPS)} ${y(0.1)} L ${x(TOTAL_STEPS)} ${y(0.1)}`
  return (
    <figure className="eps-decay">
      <svg viewBox={`0 0 ${W} ${H}`}>
        <line x1={PAD_L} y1={y(1)} x2={PAD_L} y2={H - PAD_B} className="eps-axis" />
        <line x1={PAD_L} y1={H - PAD_B} x2={W - 10} y2={H - PAD_B} className="eps-axis" />
        <path d={path} className="eps-curve" />
        <circle cx={x(DECAY_STEPS)} cy={y(0.1)} r={4} className="eps-knee" />
        <text x={x(0) + 4} y={y(1) + 4} className="eps-label">
          ε = 1.0 · pure exploration
        </text>
        <text x={x(DECAY_STEPS)} y={y(0.1) - 10} className="eps-label eps-label-knee">
          250k steps → ε = 0.1
        </text>
        <text x={W - 12} y={H - 8} className="eps-label eps-label-axis">
          steps →
        </text>
      </svg>
      <figcaption>
        The ε-greedy schedule: begin by trying everything, end by mostly trusting what you
        learned — and never stop exploring entirely.
      </figcaption>
    </figure>
  )
}
