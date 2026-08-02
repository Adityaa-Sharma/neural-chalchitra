import { nodeById } from './careerData'

/* A role is a resultant vector: the weighted sum of the project-stars that
 * compose it. The role star is placed at EXACTLY Σ wᵢ·pᵢ, so clicking it and
 * watching the vectors chain into place is honest, not decorative. */

export interface RoleComponent {
  id: string // project node id in careerData
  w: number
}

export interface Role {
  id: string
  title: string
  org: string
  period: string
  kicker: string // one-line, shown under the title in the rail
  blurb: string
  components: RoleComponent[]
}

export const ROLES: Role[] = [
  {
    id: 'savills',
    title: 'Senior AI Engineer',
    org: 'Savills APAC',
    period: '2025 — present',
    kicker: 'the client hired me',
    blurb:
      'Savills was my client at Datasmith; when I was leaving, they offered me the role directly. The serving work from MHADA, the fine-tuning from TenderGenie, the runtime agents from AI Lake and PG-AGI — this role is their weighted sum: architecting the APAC agent platform and hiring the team that builds it.',
    components: [
      { id: 'mhada', w: 0.6 },
      { id: 'tendergenie', w: 0.5 },
      { id: 'ailake', w: 0.2 },
      { id: 'pgagi', w: 0.15 },
    ],
  },
  {
    id: 'datasmith',
    title: 'Founding Member',
    org: 'Datasmith.ai',
    period: '2024 — 2025',
    kicker: 'client POC → production, end to end',
    blurb:
      'I interviewed the hires, talked to the clients, and owned delivery from first POC to production. MHADA at government scale, the TenderGenie fine-tune, AI Lake — with the RAG instincts from RefReader folded in.',
    components: [
      { id: 'mhada', w: 0.55 },
      { id: 'tendergenie', w: 0.4 },
      { id: 'ailake', w: 0.3 },
      { id: 'refreader', w: 0.1 },
    ],
  },
  {
    id: 'foundations',
    title: 'Papers, from scratch',
    org: 'self-directed',
    period: '2025',
    kicker: 'read the paper, then rebuilt it',
    blurb:
      'Not a job — my own research track. GPT-2, Linformer and DQN re-implemented end to end from the papers, because I want to understand these systems at the layer where they work, not just use them.',
    components: [
      { id: 'gpt2', w: 0.4 },
      { id: 'linformer', w: 0.3 },
      { id: 'dqn', w: 0.4 },
    ],
  },
]

/** Σ wᵢ·pᵢ over a role's components — where its star sits. */
export function resultantOf(role: Role): [number, number] {
  let x = 0
  let y = 0
  for (const c of role.components) {
    const n = nodeById(c.id)
    if (!n) continue
    x += c.w * n.x
    y += c.w * n.y
  }
  return [x, y]
}
