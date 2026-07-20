import { Suspense, type RefObject } from 'react'
import { Canvas } from '@react-three/fiber'
import type * as THREE from 'three'
import { Starfield } from './Starfield'
import { GalaxyNodes } from './GalaxyNodes'
import { CameraRig } from './CameraRig'

export interface GalaxyProps {
  scrollRef: RefObject<number>
  pointerRef: RefObject<{ x: number; y: number }>
  focusRef: RefObject<THREE.Vector3 | null>
  activeId: string | null
  litSet: Set<string> | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  reduced: boolean
  starCount: number
}

/** The WebGL canvas. Lazy-loaded so three.js never blocks first paint. */
export default function Galaxy({
  scrollRef,
  pointerRef,
  focusRef,
  activeId,
  litSet,
  onSelect,
  onHover,
  reduced,
  starCount,
}: GalaxyProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.5, 9], fov: 60, near: 0.1, far: 220 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      frameloop={reduced ? 'demand' : 'always'}
    >
      <color attach="background" args={['#07060a']} />
      <fogExp2 attach="fog" args={['#07060a', 0.017]} />
      <Suspense fallback={null}>
        <Starfield count={starCount} reduced={reduced} />
        <GalaxyNodes activeId={activeId} litSet={litSet} onSelect={onSelect} onHover={onHover} />
      </Suspense>
      <CameraRig scrollRef={scrollRef} pointerRef={pointerRef} focusRef={focusRef} reduced={reduced} />
    </Canvas>
  )
}
