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
    id: 'datasmith',
    title: 'Associate AI Engineer',
    org: 'Datasmith.ai',
    period: 'Oct 2024 — present',
    kicker: 'govt-scale LLM systems, in production',
    blurb:
      'Everything I had built pointed here. Shipped MHADA-Sathi for the Government of Maharashtra — an 8-tool agent on 4×A100s serving 100+ concurrent users — with the RAG instincts from RefReader, the from-scratch model intuition from GPT-2, and the infra thinking behind InfraMind all folded in.',
    components: [
      { id: 'mhada', w: 0.55 },
      { id: 'refreader', w: 0.5 },
      { id: 'inframind', w: 0.3 },
      { id: 'gpt2', w: 0.15 },
    ],
  },
  {
    id: 'research',
    title: 'Papers, from scratch',
    org: 'self-directed',
    period: '2025',
    kicker: 'read the paper, then rebuilt it',
    blurb:
      "Not a job — a discipline. I re-implemented three papers end to end: a 21.77M-parameter GPT-2, Linformer's linear attention, and DeepMind's DQN. This is the vector that points furthest into research: models built from first principles, not imported.",
    components: [
      { id: 'gpt2', w: 0.4 },
      { id: 'linformer', w: 0.3 },
      { id: 'dqn', w: 0.4 },
    ],
  },
  {
    id: 'pgagi',
    title: 'AI/ML Intern',
    org: 'PG-AGI',
    period: 'May — Jun 2024',
    kicker: 'the first industry rep',
    blurb:
      'Where building for someone else began: a natural-language multi-database querying PoC and custom GPT builds, carried by the applied-LLM footing from the Mistral fine-tune.',
    components: [
      { id: 'mistral', w: 0.7 },
      { id: 'refreader', w: 0.15 },
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
