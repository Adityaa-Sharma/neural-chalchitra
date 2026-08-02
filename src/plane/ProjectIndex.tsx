import { useMemo } from 'react'
import { NODES, nodeById, type PlaneNode } from './careerData'
import { TIMELINE, eraLabelOf } from './galaxy/galaxyData'
import { ViewToggle, type PlaneView } from './ViewToggle'
import './ProjectIndex.css'

const KIND_LABEL: Record<string, string> = {
  origin: 'origin',
  education: 'education',
  paper: 'paper',
  project: 'project',
  work: 'production',
  learning: 'in progress',
}

/** pull a compact year / range out of the free-text period string */
function shortYear(period: string): string {
  const m = period.match(/20\d{2}\s*[—–-]\s*(?:20\d{2}|present)|20\d{2}\s*[—–-]\s*\d{2}|20\d{2}|now/i)
  return m ? m[0].replace(/\s*[—–-]\s*/, '–') : ''
}

interface EraGroup {
  label: string
  nodes: PlaneNode[]
}

/** group the timeline nodes by era, preserving flight order (origin → now) */
function useEraGroups(): EraGroup[] {
  return useMemo(() => {
    const groups: EraGroup[] = []
    for (const id of TIMELINE) {
      const n = nodeById(id)
      if (!n) continue
      const label = eraLabelOf(id)
      const last = groups[groups.length - 1]
      if (last && last.label === label) last.nodes.push(n)
      else groups.push({ label, nodes: [n] })
    }
    return groups
  }, [])
}

function ProjectCard({ node, onOpen }: { node: PlaneNode; onOpen: (id: string) => void }) {
  const year = shortYear(node.period)
  return (
    <button type="button" className="pcard" onClick={() => onOpen(node.id)}>
      <div className="pcard-top">
        <span className={`pcard-kind pcard-kind-${node.kind}`}>{KIND_LABEL[node.kind] ?? node.kind}</span>
        {year && <span className="pcard-year">{year}</span>}
      </div>
      <h4 className="pcard-title">{node.label}</h4>
      {node.sub && <p className="pcard-sub">{node.sub}</p>}
      <p className="pcard-blurb">{node.blurb}</p>
      {node.stack && (
        <div className="pcard-stack">
          {node.stack.slice(0, 4).map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      )}
      <span className="pcard-open">open the story →</span>
    </button>
  )
}

interface ProjectIndexProps {
  onOpen: (id: string) => void
  /** when present, renders the Flight/Index toggle in the header */
  view?: PlaneView
  onView?: (v: PlaneView) => void
}

/** The scannable "normal" view of the work — the same project data as the
 *  galaxy, laid out as a clean, era-grouped card grid. This is the low-effort
 *  path (recruiter with 90 seconds) and the reduced-motion / no-WebGL default. */
export function ProjectIndex({ onOpen, view, onView }: ProjectIndexProps) {
  const groups = useEraGroups()
  const total = NODES.filter((n) => n.kind !== 'career').length

  return (
    <div className="pindex">
      <header className="pindex-head">
        <div className="pindex-head-l">
          <span className="pindex-kicker">The Work</span>
          <span className="pindex-count">
            {total} projects · math → transformers → RL → infra
          </span>
        </div>
        {view && onView && <ViewToggle view={view} onChange={onView} />}
      </header>

      {groups.map((g) => (
        <section className="pindex-era" key={g.label}>
          <h3 className="pindex-era-label">{g.label}</h3>
          <div className="pindex-grid">
            {g.nodes.map((n) => (
              <ProjectCard key={n.id} node={n} onOpen={onOpen} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
