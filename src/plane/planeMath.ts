import { NODES, nodeById } from './careerData'
import { resultantOf, type Role } from './roles'

/* semantic units → SVG viewBox coordinates */
export const VIEW_W = 1000
export const VIEW_H = 720
const CX = 500
const CY = 380
const SX = 108
const SY = 96

export const px = (x: number) => CX + x * SX
export const py = (y: number) => CY - y * SY

export const FULL_VIEWBOX = `0 0 ${VIEW_W} ${VIEW_H}`

export interface ChainSeg {
  from: [number, number]
  to: [number, number]
  w: number
  id: string
  label: string
}

/** tip-to-tail chain from origin: Pk = Pk-1 + wk·vk — ends at the role star */
export function chainOf(role: Role): ChainSeg[] {
  let cur: [number, number] = [0, 0]
  const out: ChainSeg[] = []
  for (const c of role.components) {
    const n = nodeById(c.id)
    if (!n) continue
    const next: [number, number] = [cur[0] + c.w * n.x, cur[1] + c.w * n.y]
    out.push({ from: cur, to: next, w: c.w, id: c.id, label: n.label })
    cur = next
  }
  return out
}

/** camera box framing a role's cluster (origin + components + resultant) */
export function viewBoxOf(role: Role | null): string {
  if (!role) return FULL_VIEWBOX
  const pts: [number, number][] = [[0, 0], resultantOf(role)]
  for (const c of role.components) {
    const n = nodeById(c.id)
    if (n) pts.push([n.x, n.y])
  }
  const xs = pts.map((p) => px(p[0]))
  const ys = pts.map((p) => py(p[1]))
  let minX = Math.min(...xs)
  let maxX = Math.max(...xs)
  let minY = Math.min(...ys)
  let maxY = Math.max(...ys)
  const padX = (maxX - minX) * 0.35 + 150
  const padY = (maxY - minY) * 0.35 + 130
  minX -= padX
  maxX += padX
  minY -= padY
  maxY += padY
  let w = maxX - minX
  let h = maxY - minY
  const aspect = VIEW_W / VIEW_H
  if (w / h > aspect) {
    const nh = w / aspect
    const cy = (minY + maxY) / 2
    minY = cy - nh / 2
    h = nh
  } else {
    const nw = h * aspect
    const cx = (minX + maxX) / 2
    minX = cx - nw / 2
    w = nw
  }
  return `${minX.toFixed(1)} ${minY.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`
}

/** ids lit while a role is focused: its components + itself */
export function litSet(role: Role | null): Set<string> {
  if (!role) return new Set()
  const s = new Set<string>(['origin', `role-${role.id}`])
  for (const c of role.components) s.add(c.id)
  return s
}

export const NEIGHBORS: Record<string, Set<string>> = (() => {
  const map: Record<string, Set<string>> = {}
  for (const n of NODES) map[n.id] = new Set([n.id])
  for (const n of NODES) {
    for (const e of n.edges ?? []) {
      if (!map[e]) continue
      map[n.id].add(e)
      map[e].add(n.id)
    }
  }
  return map
})()

export function describePosition(x: number, y: number): string {
  const h = x < -1 ? 'research-side' : x > 1 ? 'production-side' : 'between research and production'
  const v = y > 1 ? 'up in models' : y < -1 ? 'down in infrastructure' : 'between models and infra'
  return `${h}, ${v}`
}
