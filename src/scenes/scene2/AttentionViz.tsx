import { useState } from 'react'
import { TOKENS, HEADS } from './attentionData'
import './AttentionViz.css'

const CELL = 40
const PAD = 56 // room for row/column token labels

/** gold ramp: weight 0 → transparent, weight 1 → full gold */
const goldAlpha = (w: number) => `rgba(232, 180, 79, ${(0.06 + 0.94 * w).toFixed(3)})`

export function AttentionViz() {
  const [headIdx, setHeadIdx] = useState(0)
  const [focus, setFocus] = useState<number | null>(null)
  const head = HEADS[headIdx]
  const n = TOKENS.length
  const size = PAD + n * CELL

  return (
    <figure className="attn-viz">
      <div className="attn-viz-head">
        <div role="group" aria-label="attention head" className="attn-viz-toggle">
          {HEADS.map((h, i) => (
            <button
              key={h.name}
              className={i === headIdx ? 'is-on' : ''}
              onClick={() => setHeadIdx(i)}
            >
              {h.name}
            </button>
          ))}
        </div>
        <p>{head.description}</p>
      </div>

      <div className="attn-viz-panels">
        {/* token-to-token links */}
        <svg
          viewBox={`0 0 ${n * CELL + 20} 190`}
          className="attn-links"
          onMouseLeave={() => setFocus(null)}
        >
          {TOKENS.map((t, i) => (
            <g key={`src-${i}`}>
              <text
                x={10 + i * CELL + CELL / 2}
                y={24}
                className={`attn-token ${focus === i ? 'is-focus' : ''}`}
                onMouseEnter={() => setFocus(i)}
              >
                {t}
              </text>
              <text x={10 + i * CELL + CELL / 2} y={182} className="attn-token attn-token-dst">
                {t}
              </text>
            </g>
          ))}
          {TOKENS.map((_, i) =>
            head.weights[i].map((w, j) => {
              if (w < 0.02) return null
              const dimmed = focus !== null && focus !== i
              const x1 = 10 + i * CELL + CELL / 2
              const x2 = 10 + j * CELL + CELL / 2
              return (
                <path
                  key={`${i}-${j}`}
                  d={`M ${x1} 34 C ${x1} 100, ${x2} 100, ${x2} 168`}
                  className="attn-link"
                  style={{ opacity: dimmed ? 0.04 : 0.15 + 0.85 * w }}
                />
              )
            }),
          )}
        </svg>

        {/* QK^T heatmap */}
        <svg viewBox={`0 0 ${size} ${size}`} className="attn-heatmap">
          {TOKENS.map((t, i) => (
            <g key={`lbl-${i}`}>
              <text x={PAD - 12} y={PAD + i * CELL + CELL / 2 + 5} textAnchor="end" className="attn-hm-label">
                {t}
              </text>
              <text x={PAD + i * CELL + CELL / 2} y={PAD - 12} textAnchor="middle" className="attn-hm-label">
                {t}
              </text>
            </g>
          ))}
          {head.weights.map((row, i) =>
            row.map((w, j) => (
              <rect
                key={`${i}-${j}`}
                x={PAD + j * CELL + 1.5}
                y={PAD + i * CELL + 1.5}
                width={CELL - 3}
                height={CELL - 3}
                rx={3}
                fill={j > i ? 'transparent' : goldAlpha(w)}
                stroke={j > i ? 'var(--line)' : 'transparent'}
                strokeDasharray={j > i ? '3 3' : undefined}
                className={focus !== null && focus !== i ? 'is-dim' : ''}
              >
                <title>{`${TOKENS[i]} → ${TOKENS[j]}: ${w.toFixed(2)}`}</title>
              </rect>
            )),
          )}
        </svg>
      </div>

      <figcaption>
        Hover a character to isolate its row. The dashed upper triangle is the{' '}
        <strong>causal mask</strong> — a poem is written forward, so no character may look at the
        future. Illustrative patterns; live tensors from{' '}
        <a href="https://github.com/Adityaa-Sharma/GPT-2-Scratch" target="_blank" rel="noreferrer">
          GPT-2-Scratch
        </a>{' '}
        are on the roadmap.
      </figcaption>
    </figure>
  )
}
