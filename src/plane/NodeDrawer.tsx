import { useEffect, useRef } from 'react'
import { asset } from '../lib/asset'
import { RESULTANT, type PlaneNode } from './careerData'
import { describePosition } from './planeMath'
import './NodeDrawer.css'

interface NodeDrawerProps {
  node: PlaneNode | null
  onClose: () => void
  onNav: (dir: 1 | -1) => void
}

const KIND_LABEL: Record<string, string> = {
  origin: 'the origin',
  education: 'education',
  paper: 'paper, implemented',
  project: 'project',
  work: 'production work',
  career: 'the resultant',
  learning: 'in progress',
}

/** Side drawer (desktop) / bottom sheet (mobile) with the explicit details.
 *  The plane stays visible behind it — the map never disappears. */
export function NodeDrawer({ node, onClose, onNav }: NodeDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!node) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') onNav(1)
      else if (e.key === 'ArrowLeft') onNav(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [node, onClose, onNav])

  if (!node) return null

  const weight = RESULTANT.find((r) => r.id === node.id)?.w

  return (
    <aside className="node-drawer" role="dialog" aria-label={`${node.label} details`}>
      <div className="nd-head">
        <span className={`nd-kind nd-kind-${node.kind}`}>{KIND_LABEL[node.kind]}</span>
        <div className="nd-nav">
          <button onClick={() => onNav(-1)} aria-label="previous node">
            ←
          </button>
          <button onClick={() => onNav(1)} aria-label="next node">
            →
          </button>
          <button ref={closeRef} className="nd-close" onClick={onClose} aria-label="close details">
            ×
          </button>
        </div>
      </div>

      <h3 className="nd-title">{node.label}</h3>
      {node.sub && <p className="nd-sub">{node.sub}</p>}
      <p className="nd-period">{node.period}</p>

      <p className="nd-blurb">{node.blurb}</p>

      <p className="nd-coords">
        sits at ({node.x}, {node.y}) — {describePosition(node.x, node.y)}
        {weight !== undefined && (
          <>
            <br />
            <strong>w = {weight}</strong> of the career vector
          </>
        )}
      </p>

      {node.media?.map((m) => (
        <figure className="nd-media" key={m.src}>
          <img src={asset(m.src)} alt={m.caption} width={m.w} height={m.h} loading="lazy" />
          <figcaption>{m.caption}</figcaption>
        </figure>
      ))}

      {node.stack && (
        <div className="nd-stack">
          {node.stack.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      )}

      {node.links && (
        <div className="nd-links">
          {node.links.map((l) =>
            l.url.startsWith('#') ? (
              <a key={l.url} href={l.url} onClick={onClose}>
                {l.label}
              </a>
            ) : (
              <a key={l.url} href={l.url} target="_blank" rel="noreferrer">
                {l.label}
              </a>
            ),
          )}
        </div>
      )}

      <p className="nd-hint">← → to wander · esc to close</p>
    </aside>
  )
}
