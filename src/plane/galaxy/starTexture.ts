import * as THREE from 'three'

let cached: THREE.CanvasTexture | null = null

/** A soft radial-gradient sprite — additive-blended, it reads as a glowing
 *  star/bloom with zero postprocessing cost. */
export function starTexture(): THREE.CanvasTexture {
  if (cached) return cached
  const s = 64
  const c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.25, 'rgba(255,255,255,0.85)')
  g.addColorStop(0.5, 'rgba(255,255,255,0.32)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  cached = tex
  return tex
}
