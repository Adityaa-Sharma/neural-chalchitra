import type { CSSProperties } from 'react'
import { nodeById, NODES, type PlaneNode } from './careerData'
import { ViewToggle, type PlaneView } from './ViewToggle'
import { asset } from '../lib/asset'
import './ProjectIndex.css'

const KIND_LABEL: Record<string, string> = {
  origin: 'degree',
  education: 'degree',
  paper: 'paper, rebuilt',
  project: 'project',
  work: 'shipped',
  career: 'current role',
  learning: 'in progress',
}

/* The scannable org chart of the work: WHERE he learned, WHOM he worked for
 * and what shipped there, and what he drives himself. Grouping is by
 * affiliation, not time — a reviewer bifurcates education / jobs / own work
 * at a glance. Accents: ink = education, gold = employment, teal = self-driven. */
const GROUPS: {
  key: string
  org: string
  meta: string
  accent: string
  ids: string[]
  logo?: string
}[] = [
  {
    key: 'edu',
    org: 'Education',
    meta: 'B.S. Mathematics 2020–23 · M.S. AI & ML, IIIT Lucknow 2023–25 · 9.23 CGPA',
    accent: '#ece7dd',
    ids: ['origin', 'ms-iiitl'],
    logo: 'assets/logos/iiitl.png',
  },
  {
    key: 'pgagi',
    org: 'PG-AGI',
    meta: 'AI/ML Intern · 2024',
    accent: '#e8b44f',
    ids: ['pgagi'],
    logo: 'assets/logos/pgagi.png',
  },
  {
    key: 'datasmith',
    org: 'Datasmith.ai',
    meta: 'Founding member · 2024 — 2025 · POC → production',
    accent: '#e8b44f',
    ids: ['ailake', 'mhada', 'tendergenie'],
    logo: 'assets/logos/datasmith.svg',
  },
  {
    key: 'savills',
    org: 'Savills',
    meta: 'Senior AI Engineer · APAC · 2025 — present',
    accent: '#e8b44f',
    ids: ['career'],
    logo: 'assets/logos/savills.png',
  },
  {
    key: 'freelance',
    org: 'Freelance',
    meta: 'live products, end-to-end ownership',
    accent: '#63d8c6',
    ids: ['eve', 'latimer'],
  },
  {
    key: 'research',
    org: 'Independent research',
    meta: 'papers rebuilt from scratch · engines read from source',
    accent: '#63d8c6',
    ids: ['gpt2', 'linformer', 'dqn', 'cuda', 'vllm-study'],
  },
  {
    key: 'personal',
    org: 'Personal projects',
    meta: 'built for myself, running',
    accent: '#63d8c6',
    ids: ['refreader', 'tradingmcp'],
  },
]

/** pull a compact year / range out of the free-text period string */
function shortYear(period: string): string {
  const m = period.match(/20\d{2}\s*[—–-]\s*(?:20\d{2}|present)|20\d{2}\s*[—–-]\s*\d{2}|20\d{2}|now/i)
  return m ? m[0].replace(/\s*[—–-]\s*/, '–') : ''
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

/** The scannable "normal" view of the work — same data as the galaxy, laid
 *  out as an org-grouped card grid. The low-effort path (recruiter with 90
 *  seconds) and the reduced-motion / no-WebGL default. */
export function ProjectIndex({ onOpen, view, onView }: ProjectIndexProps) {
  const total = NODES.length

  return (
    <div className="pindex">
      <header className="pindex-head">
        <div className="pindex-head-l">
          <span className="pindex-kicker">The Work</span>
          <span className="pindex-count">{total} stars · education → jobs → own work</span>
        </div>
        {view && onView && <ViewToggle view={view} onChange={onView} />}
      </header>

      {GROUPS.map((g) => {
        const nodes = g.ids.map((id) => nodeById(id)).filter((n): n is PlaneNode => !!n)
        return (
          <section
            className="pindex-group"
            key={g.key}
            style={{ '--grp': g.accent } as CSSProperties}
          >
            <header className="pindex-group-head">
              {g.logo && (
                <span className="pindex-logo">
                  <img src={asset(g.logo)} alt="" loading="lazy" />
                </span>
              )}
              <h3 className="pindex-org">{g.org}</h3>
              <span className="pindex-meta">{g.meta}</span>
            </header>
            <div className="pindex-grid">
              {nodes.map((n) => (
                <ProjectCard key={n.id} node={n} onOpen={onOpen} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
