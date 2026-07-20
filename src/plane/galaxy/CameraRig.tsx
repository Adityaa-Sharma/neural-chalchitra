import { useMemo, type RefObject } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FLIGHT_WAYPOINTS } from './galaxyData'

interface CameraRigProps {
  scrollRef: RefObject<number>
  pointerRef: RefObject<{ x: number; y: number }>
  /** when set, camera flies to focus this world point instead of the scroll path */
  focusRef: RefObject<THREE.Vector3 | null>
  reduced?: boolean
}

/** Drives the camera along the flight curve by scroll progress, with mouse
 *  parallax — or banks to a focus point when a node/role is selected. */
export function CameraRig({ scrollRef, pointerRef, focusRef, reduced }: CameraRigProps) {
  const { camera } = useThree()

  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(FLIGHT_WAYPOINTS.map((p) => new THREE.Vector3(...p))),
    [],
  )
  const target = useMemo(() => new THREE.Vector3(), [])
  const look = useMemo(() => new THREE.Vector3(), [])
  const desired = useMemo(() => new THREE.Vector3(), [])

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
  })

  return null
}
