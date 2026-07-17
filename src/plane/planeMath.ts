import { NODES, RESULTANT, nodeById } from './careerData'

/* semantic units → SVG viewBox coordinates */
export const VIEW_W = 1000
export const VIEW_H = 720
const CX = 500
const CY = 380
const SX = 105
const SY = 92

export const px = (x: number) => CX + x * SX
export const py = (y: number) => CY - y * SY

/** tip-to-tail chain: P0 = origin, Pk = Pk-1 + wk·vk — ends on the career node */
export const CHAIN: { from: [number, number]; to: [number, number]; w: number; id: string }[] =
  (() => {
    let cur: [number, number] = [0, 0]
    const out = []
    for (const { id, w } of RESULTANT) {
      const n = nodeById(id)!
      const next: [number, number] = [cur[0] + w * n.x, cur[1] + w * n.y]
      out.push({ from: cur, to: next, w, id })
      cur = next
    }
    return out
  })()

/** neighbor lookup for hover focus (1-hop, Quartz-style) */
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

/** read a node's position semantically for the drawer */
export function describePosition(x: number, y: number): string {
  const h = x < -1 ? 'research-side' : x > 1 ? 'production-side' : 'between research and production'
  const v = y > 1 ? 'up in models' : y < -1 ? 'down in infrastructure' : 'between models and infra'
  return `${h}, ${v}`
}
