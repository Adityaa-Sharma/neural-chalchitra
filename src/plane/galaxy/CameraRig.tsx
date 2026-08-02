import { useMemo, useRef, type RefObject } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { STATIONS, stationCam } from './galaxyData'

interface CameraRigProps {
  scrollRef: RefObject<number>
  pointerRef: RefObject<{ x: number; y: number }>
  /** when set, camera flies to focus this world point instead of the stations */
  focusRef: RefObject<THREE.Vector3 | null>
  /** fired (on change only) with the station index the camera is at/approaching */
  onStation?: (i: number) => void
  reduced?: boolean
}

/** how much of each scroll segment is spent travelling (the rest is a pause) */
const TRAVEL = 0.38

const smooth = (x: number) => x * x * (3 - 2 * x)

/** Station-to-station flight: the camera RESTS at each chapter (~62% of its
 *  scroll segment), then moves deliberately to the next. No wander — directed
 *  flow with pauses, per the owner's spec. Mouse adds only a small parallax. */
export function CameraRig({ scrollRef, pointerRef, focusRef, onStation, reduced }: CameraRigProps) {
  const { camera, scene } = useThree()

  const cams = useMemo(
    () =>
      STATIONS.map((_, i) => {
        const c = stationCam(i)
        return { pos: new THREE.Vector3(...c.pos), look: new THREE.Vector3(...c.look) }
      }),
    [],
  )
  const desired = useMemo(() => new THREE.Vector3(), [])
  const look = useMemo(() => new THREE.Vector3(), [])
  const lastStation = useRef(-1)

  // chapter colour drift — cold indigo at the origin, warm gold at the present
  const cold = useMemo(() => new THREE.Color('#08070f'), [])
  const warm = useMemo(() => new THREE.Color('#160d07'), [])

  useFrame(() => {
    const t = THREE.MathUtils.clamp(scrollRef.current ?? 0, 0, 1)
    const focus = focusRef.current
    const N = STATIONS.length

    if (focus) {
      // frame the focused star: a little in front and above it
      desired.set(focus.x * 0.85, focus.y * 0.85 + 1.1, focus.z + 7.5)
      look.copy(focus)
    } else {
      const i = Math.min(N - 1, Math.floor(t * N))
      const local = t * N - i

      if (i === 0 || local >= TRAVEL) {
        // pause: rest at this station
        desired.copy(cams[i].pos)
        look.copy(cams[i].look)
      } else {
        // travel: deliberate ease from the previous station
        const s = smooth(local / TRAVEL)
        desired.lerpVectors(cams[i - 1].pos, cams[i].pos, s)
        look.lerpVectors(cams[i - 1].look, cams[i].look, s)
      }

      // announce the chapter (switch mid-travel, once the move is committed)
      const idx = i > 0 && local < TRAVEL * 0.5 ? i - 1 : i
      if (idx !== lastStation.current) {
        lastStation.current = idx
        onStation?.(idx)
      }

      // small parallax only — the flow stays directed
      const px = pointerRef.current?.x ?? 0
      const py = pointerRef.current?.y ?? 0
      desired.x += px * 0.9
      desired.y += py * 0.55
    }

    camera.position.lerp(desired, reduced ? 1 : 0.07)
    camera.lookAt(look)

    // colour zone by flight progress (subtle, always-on)
    if (scene.fog && 'color' in scene.fog) {
      ;(scene.fog as THREE.FogExp2).color.lerpColors(cold, warm, t)
    }
    if (scene.background instanceof THREE.Color) {
      scene.background.lerpColors(cold, warm, t)
    }
  })

  return null
}
