import { NODES, nodeById } from '../careerData'
import { ROLES, resultantOf, type Role } from '../roles'

/* Lift the 2D career plane into 3D.
 *   x: research (−) ↔ production (+)   — same as the plane
 *   y: models (+) ↔ infrastructure (−) — same as the plane
 *   z: TIME. The origin (math) sits deepest in the past (most negative z);
 *      today sits nearest the camera (z ≈ 0). Scrolling forward flies the
 *      camera along −z→0, i.e. through the timeline toward the present.
 *
 * World scale: 1 semantic plane-unit ≈ 1.15 world units. */

export const SCALE = 1.15

/** era → z depth (world units). Origin sits nearest the camera's start (z≈0);
 *  the present is deepest (most negative), so scrolling flies FORWARD through
 *  time toward today — you arrive at the career star. */
const ERA_Z: Record<string, number> = {
  origin: 0, // the math degree — where the flight begins
  '2024a': -12, // early 2024 — first applied work
  '2024b': -22, // mid/late 2024
  '2025': -32, // papers + shipped systems
  now: -44, // present — the destination
}

/** each node id → which era band it lives in */
const NODE_ERA: Record<string, keyof typeof ERA_Z> = {
  origin: 'origin',
  'ms-iiitl': '2024a',
  mistral: '2024a',
  pgagi: '2024a',
  gpt2: '2025',
  linformer: '2025',
  dqn: '2025',
  refreader: '2024b',
  tradingmcp: '2025',
  inframind: 'now',
  cuda: 'now',
  'vllm-study': 'now',
  mhada: '2024b',
  career: 'now',
}

export interface GalaxyNode {
  id: string
  label: string
  sub?: string
  kind: string
  pos: [number, number, number]
  /** star radius in world units */
  size: number
}

const KIND_SIZE: Record<string, number> = {
  origin: 0.58,
  education: 0.32,
  paper: 0.4,
  project: 0.4,
  work: 0.44,
  learning: 0.28,
  career: 0.6,
}

/** deterministic small z-jitter so same-era stars don't stack on one plane */
function jitter(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return (((h >>> 0) % 1000) / 1000 - 0.5) * 5.5
}

function zOf(id: string): number {
  const era = NODE_ERA[id] ?? 'now'
  return ERA_Z[era] + jitter(id)
}

export const GALAXY_NODES: GalaxyNode[] = NODES.map((n) => ({
  id: n.id,
  label: n.label,
  sub: n.sub,
  kind: n.kind,
  pos: [n.x * SCALE * 1.25, n.y * SCALE * 1.25, zOf(n.id)],
  size: KIND_SIZE[n.kind] ?? 0.4,
}))

/** role destination stars, placed at Σ wᵢpᵢ (x,y) and near-present z */
export interface GalaxyRole {
  id: string
  pos: [number, number, number]
}
export const GALAXY_ROLES: GalaxyRole[] = ROLES.map((r) => {
  const [x, y] = resultantOf(r)
  return { id: r.id, pos: [x * SCALE * 1.25, y * SCALE * 1.25, -7] }
})

export function galaxyNodeById(id: string): GalaxyNode | undefined {
  return GALAXY_NODES.find((n) => n.id === id)
}

/** tip-to-tail chain in 3D for a role's vector sum */
export function chain3D(role: Role): {
  from: [number, number, number]
  to: [number, number, number]
  id: string
  w: number
}[] {
  let cur: [number, number, number] = [0, 0, ERA_Z.origin]
  const out = []
  for (const c of role.components) {
    const n = nodeById(c.id)
    if (!n) continue
    const next: [number, number, number] = [
      cur[0] + c.w * n.x * SCALE,
      cur[1] + c.w * n.y * SCALE,
      cur[2] + c.w * (zOf(c.id) - ERA_Z.origin),
    ]
    out.push({ from: cur, to: next, id: c.id, w: c.w })
    cur = next
  }
  return out
}

/** camera flight path: starts just in front of the origin (+z), flies forward
 *  through −z past each era, arriving near the present. Camera looks toward −z. */
export const FLIGHT_WAYPOINTS: [number, number, number][] = [
  [0, 0.5, ERA_Z.origin + 9],
  [-1.6, 1.1, ERA_Z['2024a'] + 8],
  [1.3, 0.6, ERA_Z['2024b'] + 8],
  [-0.7, 1.1, ERA_Z['2025'] + 8],
  [1.6, 0.5, ERA_Z.now + 8],
]
