import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { GALAXY_NODES, GALAXY_ROLES, type GalaxyNode } from './galaxyData'
import { starTexture } from './starTexture'
import './galaxyNodes.css'

const COLORS: Record<string, string> = {
  origin: '#fff4dc',
  education: '#e8b44f',
  paper: '#63d8c6',
  project: '#63d8c6',
  work: '#e8b44f',
  learning: '#63d8c6',
  career: '#e8b44f',
}

interface NodeProps {
  node: GalaxyNode
  active: boolean
  dim: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

function StarNode({ node, active, dim, onSelect, onHover }: NodeProps) {
  const grp = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const color = COLORS[node.kind] ?? '#63d8c6'
  const lit = active || hovered

  useFrame((state) => {
    if (!grp.current) return
    // gentle breathing + face-camera glow sprite handled by sizeAttenuation
    const t = state.clock.elapsedTime
    const s = (lit ? 1.25 : 1) * (1 + Math.sin(t * 1.5 + node.pos[0]) * 0.04)
    grp.current.scale.setScalar(THREE.MathUtils.lerp(grp.current.scale.x, s, 0.15))
  })

  return (
    <group position={node.pos} ref={grp}>
      {/* glow sprite */}
      <sprite scale={node.size * 3.4}>
        <spriteMaterial
          map={starTexture()}
          color={color}
          transparent
          opacity={dim ? 0.1 : 0.42}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      {/* solid core (also the raycast target) */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          onHover(node.id)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          onHover(null)
          document.body.style.cursor = ''
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(node.id)
        }}
      >
        <sphereGeometry args={[node.size, 24, 24]} />
        <meshBasicMaterial color={color} toneMapped={false} transparent opacity={dim ? 0.3 : 1} />
      </mesh>
      {/* label */}
      <Html
        position={[0, node.size + 0.5, 0]}
        center
        distanceFactor={14}
        occlude={false}
        style={{ pointerEvents: 'none' }}
      >
        <div className={`gx-label ${lit ? 'is-lit' : ''} ${dim ? 'is-dim' : ''}`}>
          <span className="gx-label-name">{node.label}</span>
          {node.sub && <span className="gx-label-sub">{node.sub}</span>}
        </div>
      </Html>
    </group>
  )
}

interface GalaxyNodesProps {
  activeId: string | null
  litSet: Set<string> | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

export function GalaxyNodes({ activeId, litSet, onSelect, onHover }: GalaxyNodesProps) {
  return (
    <group>
      {GALAXY_NODES.filter((n) => n.kind !== 'career').map((n) => (
        <StarNode
          key={n.id}
          node={n}
          active={activeId === n.id}
          dim={!!litSet && !litSet.has(n.id)}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}
      {/* role destination stars (gold, larger) */}
      {GALAXY_ROLES.map((r) => {
        const node = GALAXY_NODES.find((n) => n.id === 'career')!
        return (
          <StarNode
            key={r.id}
            node={{ ...node, id: r.id, label: '', sub: undefined, pos: r.pos, size: 0.55 }}
            active={activeId === `role-${r.id}`}
            dim={!!litSet && !litSet.has(`role-${r.id}`)}
            onSelect={() => onSelect(`role-${r.id}`)}
            onHover={() => {}}
          />
        )
      })}
    </group>
  )
}
