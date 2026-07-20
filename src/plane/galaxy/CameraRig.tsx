import { useMemo, useRef, type RefObject } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FLIGHT_WAYPOINTS, FLYABLE_NODES } from './galaxyData'

interface CameraRigProps {
  scrollRef: RefObject<number>
  pointerRef: RefObject<{ x: number; y: number }>
  /** when set, camera flies to focus this world point instead of the scroll path */
  focusRef: RefObject<THREE.Vector3 | null>
  /** fired (on change only) with the id of the star the camera is currently passing */
  onNear?: (id: string) => void
  reduced?: boolean
}

/** Drives the camera along the flight curve by scroll progress, with mouse
 *  parallax — or banks to a focus point when a node/role is selected.
 *  Also (a) announces the nearest star so the HUD can name it, and (b) drifts
 *  the fog/background from cold indigo (origin) to warm gold (present) so the
 *  timeline reads as a colour zone, not just more dots. */
export function CameraRig({ scrollRef, pointerRef, focusRef, onNear, reduced }: CameraRigProps) {
  const { camera, scene } = useThree()

  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(FLIGHT_WAYPOINTS.map((p) => new THREE.Vector3(...p))),
    [],
  )
  const target = useMemo(() => new THREE.Vector3(), [])
  const look = useMemo(() => new THREE.Vector3(), [])
  const desired = useMemo(() => new THREE.Vector3(), [])
  const probe = useMemo(() => new THREE.Vector3(), [])

  // flyable stars as world vectors, for the "now passing" nearest lookup
  const stars = useMemo(
    () => FLYABLE_NODES.map((n) => ({ id: n.id, v: new THREE.Vector3(...n.pos) })),
    [],
  )
  const lastNear = useRef<string | null>(null)

  // era colour zones — cold indigo → warm gold
  const cold = useMemo(() => new THREE.Color('#08070f'), [])
  const warm = useMemo(() => new THREE.Color('#160d07'), [])

  useFrame(() => {
    const t = THREE.MathUtils.clamp(scrollRef.current ?? 0, 0, 1)
    const focus = focusRef.current

    if (focus) {
      // frame the focused point: sit a little in front (+z) and above it
      desired.set(focus.x * 0.6, focus.y * 0.6 + 1.2, focus.z + 8.5)
      look.copy(focus)
    } else {
      curve.getPointAt(t, target)
      const px = pointerRef.current?.x ?? 0
      const py = pointerRef.current?.y ?? 0
      desired.copy(target).add(new THREE.Vector3(px * 2.4, py * 1.5, 0))
      // look forward into the field (−z), easing x/y toward center
      look.set(target.x * 0.3, target.y * 0.3, target.z - 16)
    }

    camera.position.lerp(desired, reduced ? 1 : 0.06)
    camera.lookAt(look)

    // colour zone by flight progress (subtle, always-on)
    if (scene.fog && 'color' in scene.fog) {
      ;(scene.fog as THREE.FogExp2).color.lerpColors(cold, warm, t)
    }
    if (scene.background instanceof THREE.Color) {
      scene.background.lerpColors(cold, warm, t)
    }

    // announce the nearest star — probe just ahead of the camera, weighting the
    // time (z) axis so "now passing" tracks the era, not a lateral neighbour
    if (onNear) {
      probe.set(camera.position.x, camera.position.y, camera.position.z - 8)
      let best: string | null = null
      let bestD = Infinity
      for (const s of stars) {
        const dx = s.v.x - probe.x
        const dy = s.v.y - probe.y
        const dz = (s.v.z - probe.z) * 1.7 // weight time heavily
        const d = dx * dx + dy * dy + dz * dz
        if (d < bestD) {
          bestD = d
          best = s.id
        }
      }
      if (best && best !== lastNear.current) {
        lastNear.current = best
        onNear(best)
      }
    }
  })

  return null
}
