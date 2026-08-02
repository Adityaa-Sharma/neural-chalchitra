import { useMemo } from 'react'
import * as THREE from 'three'
import { starTexture } from './starTexture'

/* Deterministic ambient star cloud filling the volume the camera flies through.
 * Additive blending makes overlaps saturate into glow. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const GOLD = new THREE.Color('#e8b44f')
const TEAL = new THREE.Color('#63d8c6')
const WARM = new THREE.Color('#fff4dc')

export function Starfield({ count = 1300 }: { count?: number; reduced?: boolean }) {
  const { positions, colors, sizes } = useMemo(() => {
    const rand = mulberry32(9973)
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      // a wide, deep slab of space around the flight path (z from -78..8)
      let x = (rand() - 0.5) * 80
      let y = (rand() - 0.5) * 46
      const z = -78 + rand() * 86
      // keep ambience OUT of the camera corridor: a point near the lens axis
      // renders as a giant blob. push it radially to the flanks.
      const rad = Math.hypot(x, y)
      if (rad < 14) {
        const s = (14 + rand() * 18) / Math.max(rad, 0.001)
        x *= s
        y *= s
      }
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
      const r = rand()
      const col = r > 0.82 ? TEAL : r > 0.66 ? GOLD : WARM
      colors[i * 3] = col.r
      colors[i * 3 + 1] = col.g
      colors[i * 3 + 2] = col.b
      sizes[i] = 0.06 + rand() * 0.4
    }
    return { positions, colors, sizes }
  }, [count])

  // no rotation drift: it would carry corridor-excluded points back in front
  // of the lens. the flight itself provides all the motion needed.
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        map={starTexture()}
        size={0.5}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
