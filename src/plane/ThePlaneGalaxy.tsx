import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import * as THREE from 'three'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { Reveal } from '../components/Reveal'
import { RevealTitle } from '../components/RevealTitle'
import { NODES, type PlaneNode } from './careerData'
import { galaxyNodeById } from './galaxy/galaxyData'
import { NodeDrawer } from './NodeDrawer'
import './ThePlaneGalaxy.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const Galaxy = lazy(() => import('./galaxy/Galaxy'))
const ThePlane2D = lazy(() => import('./ThePlane').then((m) => ({ default: m.ThePlane })))

function canRunWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}

export function ThePlaneGalaxy() {
  const reducedMotion = usePrefersReducedMotion()
  const [use3D, setUse3D] = useState<boolean | null>(null)

  // decide once, on the client
  useEffect(() => {
    setUse3D(canRunWebGL() && !reducedMotion)
  }, [reducedMotion])

  if (use3D === null) return <section id="plane" style={{ minHeight: '100vh' }} />
  if (!use3D) return <Fallback2D />
  return <Galaxy3D />
}

function Fallback2D() {
  return (
    <Suspense fallback={<section id="plane" style={{ minHeight: '100vh' }} />}>
      <ThePlane2D />
    </Suspense>
  )
}

function Galaxy3D() {
  const rootRef = useRef<HTMLElement>(null)
  const scrollRef = useRef(0)
  const pointerRef = useRef({ x: 0, y: 0 })
  const focusRef = useRef<THREE.Vector3 | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  const starCount = useMemo(
    () => (typeof window !== 'undefined' && window.innerWidth < 768 ? 700 : 1300),
    [],
  )

  // scroll → flight progress (0..1) across the tall section
  useGSAP(
    () => {
      const st = ScrollTrigger.create({
        trigger: rootRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        onUpdate: (self) => {
          scrollRef.current = self.progress
        },
      })
      return () => st.kill()
    },
    { scope: rootRef },
  )

  // pointer parallax
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      pointerRef.current.x = (e.clientX - r.left) / r.width - 0.5
      pointerRef.current.y = -((e.clientY - r.top) / Math.max(1, window.innerHeight) - 0.5)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  const select = useCallback((id: string) => {
    // role-* ids come from role stars; project ids open the drawer
    if (id.startsWith('role-')) return
    setSelected(id)
    history.replaceState(null, '', `#node=${id}`)
    const n = galaxyNodeById(id)
    if (n) focusRef.current = new THREE.Vector3(...n.pos)
  }, [])

  const closeDrawer = useCallback(() => {
    setSelected(null)
    focusRef.current = null
    history.replaceState(null, '', '#plane')
  }, [])

  // daimon can open nodes
  useEffect(() => {
    const onOpen = (e: Event) => {
      const id = (e as CustomEvent<string>).detail
      if (NODES.some((n) => n.id === id)) {
        rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        select(id)
      }
    }
    window.addEventListener('plane:open', onOpen)
    return () => window.removeEventListener('plane:open', onOpen)
  }, [select])

  const node = useMemo(() => NODES.find((n) => n.id === selected) ?? null, [selected])

  return (
    <section className="galaxy-section" id="plane" ref={rootRef}>
      <div className="galaxy-sticky">
        <div className="galaxy-canvas">
          <Suspense fallback={null}>
            <Galaxy
              scrollRef={scrollRef}
              pointerRef={pointerRef}
              focusRef={focusRef}
              activeId={selected ?? hovered}
              litSet={null}
              onSelect={select}
              onHover={setHovered}
              reduced={false}
              starCount={starCount}
            />
          </Suspense>
        </div>

        <div className="galaxy-overlay">
          <Reveal className="slate">
            <strong>The Plane</strong> निर्देशांक तल
          </Reveal>
          <RevealTitle className="scene-title galaxy-title">
            A career is a flight through space.
          </RevealTitle>
          <Reveal as="p" className="prose galaxy-lede">
            Every project is a star at its own coordinates in time. Scroll to fly from the origin —
            a mathematics degree — forward to today. Tap any star for the full story.
          </Reveal>
          <Reveal as="p" className="galaxy-scrollcue" aria-hidden="true">
            scroll to fly ↓
          </Reveal>
        </div>
      </div>

      <NodeDrawer
        node={node as PlaneNode | null}
        onClose={closeDrawer}
        onNav={(dir) => {
          if (!node) return
          const list = NODES.filter((n) => n.kind !== 'career')
          const i = list.findIndex((n) => n.id === node.id)
          select(list[(i + dir + list.length) % list.length].id)
        }}
      />
    </section>
  )
}
