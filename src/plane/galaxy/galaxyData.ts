import { NODES, nodeById } from '../careerData'
import { ROLES, resultantOf, type Role } from '../roles'

/* The flight is a sequence of STATIONS — one per affiliation, same order as
 * the Index: Education → PG-AGI → Datasmith → own track → Savills.
 *
 * Directed flow, by design (owner's spec):
 *   - the camera pauses at each station, travels deliberately between them
 *   - each station's stars sit on a tight local shelf, not scattered
 *   - station 4 bifurcates: independent research LEFT, freelance/personal RIGHT
 *   - the flight ends at the current role. */

export interface GalaxyStation {
  id: string
  /** chapter heading (org) */
  title: string
  /** role · period line under it */
  meta: string
  /** stars on the (only or left) shelf */
  ids: string[]
  /** stars on the right shelf when the station bifurcates */
  rightIds?: string[]
  /** world anchor the shelf is built around */
  anchor: [number, number, number]
  /** camera rest distance in front of the anchor */
  camDist: number
}

export const STATIONS: GalaxyStation[] = [
  {
    id: 'edu',
    title: 'Education',
    meta: 'B.S. Mathematics → M.S. AI & ML · IIIT Lucknow',
    ids: ['origin', 'ms-iiitl'],
    anchor: [0, 0.4, 0],
    camDist: 8.5,
  },
  {
    id: 'pgagi',
    title: 'PG-AGI',
    meta: 'AI/ML Intern · 2024',
    ids: ['pgagi'],
    anchor: [2.6, 0.4, -12],
    camDist: 8,
  },
  {
    id: 'datasmith',
    title: 'Datasmith.ai',
    meta: 'Founding member · 2024 — 2025 · POC → production',
    ids: ['ailake', 'mhada', 'tendergenie'],
    anchor: [-2.4, 0.4, -24],
    camDist: 9.5,
  },
  {
    id: 'own',
    title: 'My own track',
    meta: 'independent research ← · → freelance & personal',
    ids: ['gpt2', 'linformer', 'dqn', 'cuda', 'vllm-study'],
    rightIds: ['eve', 'latimer', 'refreader', 'tradingmcp'],
    // deep enough that the camera's rest point (anchor.z + camDist) keeps
    // ≥5 units clearance from the previous shelf — never park the lens
    // inside or against a chapter
    anchor: [0, 0.6, -44],
    camDist: 13.5,
  },
  {
    id: 'savills',
    title: 'Savills',
    meta: 'Senior AI Engineer · APAC · 2025 — present',
    ids: ['career'],
    anchor: [0, 0.4, -60],
    camDist: 7.5,
  },
]

export interface GalaxyNode {
  id: string
  label: string
  sub?: string
  kind: string
  pos: [number, number, number]
  /** star radius in world units */
  size: number
}

/* Sizes normalized within a band — no star may swallow the frame. */
const KIND_SIZE: Record<string, number> = {
  origin: 0.44,
  education: 0.36,
  paper: 0.38,
  project: 0.38,
  work: 0.46,
  learning: 0.34,
  career: 0.55,
}

/** deterministic small jitter so shelves don't read as a ruler */
function jitter(id: string, scale = 1): number {
  let h = 0
  for (const i of id) h = (h * 31 + i.charCodeAt(0)) | 0
  return (((h >>> 0) % 1000) / 1000 - 0.5) * scale
}

/** lay a shelf of stars around a center: gentle arc, alternating rise/dip */
function shelf(ids: string[], center: [number, number, number]): Map<string, [number, number, number]> {
  const out = new Map<string, [number, number, number]>()
  const n = ids.length
  const spacing = n > 3 ? 2.0 : 2.6
  ids.forEach((id, i) => {
    const x = center[0] + (i - (n - 1) / 2) * spacing + jitter(id, 0.5)
    // single stars sit dead-center so the camera frames star + label cleanly
    const yOff = n === 1 ? 0 : i % 2 === 0 ? 0.65 : -0.65
    const y = center[1] + yOff + jitter(id + 'y', 0.4)
    const z = center[2] + jitter(id + 'z', 1.4)
    out.set(id, [x, y, z])
  })
  return out
}

/** every star's world position, computed from its station's shelf layout */
const POSITIONS: Map<string, [number, number, number]> = (() => {
  const m = new Map<string, [number, number, number]>()
  for (const s of STATIONS) {
    const split = !!s.rightIds
    const leftCenter: [number, number, number] = split
      ? [s.anchor[0] - 5.4, s.anchor[1], s.anchor[2]]
      : s.anchor
    for (const [id, p] of shelf(s.ids, leftCenter)) m.set(id, p)
    if (s.rightIds) {
      const rightCenter: [number, number, number] = [s.anchor[0] + 5.4, s.anchor[1], s.anchor[2]]
      for (const [id, p] of shelf(s.rightIds, rightCenter)) m.set(id, p)
    }
  }
  return m
})()

export const GALAXY_NODES: GalaxyNode[] = NODES.filter((n) => POSITIONS.has(n.id)).map((n) => ({
  id: n.id,
  label: n.label,
  sub: n.sub,
  kind: n.kind,
  pos: POSITIONS.get(n.id)!,
  size: KIND_SIZE[n.kind] ?? 0.38,
}))

export function galaxyNodeById(id: string): GalaxyNode | undefined {
  return GALAXY_NODES.find((n) => n.id === id)
}

/** ids visible at a station (both shelves) — the HUD lights these labels */
export function stationIds(i: number): Set<string> {
  const s = STATIONS[Math.max(0, Math.min(STATIONS.length - 1, i))]
  return new Set([...s.ids, ...(s.rightIds ?? [])])
}

/** camera rest pose for a station */
export function stationCam(i: number): {
  pos: [number, number, number]
  look: [number, number, number]
} {
  const s = STATIONS[Math.max(0, Math.min(STATIONS.length - 1, i))]
  return {
    pos: [s.anchor[0], s.anchor[1] + 0.8, s.anchor[2] + s.camDist],
    look: s.anchor,
  }
}

/* Retained for the roles feature (vector-sum): role destination points from
 * the semantic plane. Not rendered in the station flight. */
export interface GalaxyRole {
  id: string
  pos: [number, number, number]
}
export const GALAXY_ROLES: GalaxyRole[] = ROLES.map((r) => {
  const [x, y] = resultantOf(r)
  return { id: r.id, pos: [x * 1.15, y * 1.15, -7] }
})

/** tip-to-tail chain in 3D for a role's vector sum (semantic plane coords) */
export function chain3D(role: Role): {
  from: [number, number, number]
  to: [number, number, number]
  id: string
  w: number
}[] {
  let cur: [number, number, number] = [0, 0, 0]
  const out = []
  for (const c of role.components) {
    const n = nodeById(c.id)
    if (!n) continue
    const next: [number, number, number] = [
      cur[0] + c.w * n.x * 1.15,
      cur[1] + c.w * n.y * 1.15,
      cur[2],
    ]
    out.push({ from: cur, to: next, id: c.id, w: c.w })
    cur = next
  }
  return out
}
