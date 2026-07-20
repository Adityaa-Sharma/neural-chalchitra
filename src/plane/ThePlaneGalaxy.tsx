import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import * as THREE from 'three'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { Reveal } from '../components/Reveal'
import { RevealTitle } from '../components/RevealTitle'
import { NODES, nodeById, type PlaneNode } from './careerData'
import { galaxyNodeById, eraLabelOf, timelineIndex, TIMELINE } from './galaxy/galaxyData'
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
  // the star the camera is currently flying past — grounds the whole HUD
  const [nearId, setNearId] = useState<string>('origin')

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

  // HUD grounding data — always reflects the star the camera is passing
  const nearNode = nodeById(nearId)
  const eraLabel = eraLabelOf(nearId)
  const idx = timelineIndex(nearId)
  const total = TIMELINE.length
  const flying = nearId !== 'origin'
  const pad2 = (n: number) => String(n).padStart(2, '0')

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
              nearId={nearId}
              litSet={null}
              onSelect={select}
              onHover={setHovered}
              onNear={setNearId}
              reduced={false}
              starCount={starCount}
            />
          </Suspense>
        </div>

        {/* persistent metadata layer — keeps the star-field legible: the frame
            always says these are PROJECTS, which era you're in, and names the
            star you're passing. (the sidewave move.) */}
        <div className="gx-hud">
          <div className="gx-hud-bar">
            <span className="gx-hud-mark">NEURAL CHALCHITRA</span>
            <span className="gx-hud-tag">/ PROJECTS</span>
            <span className="gx-hud-era">{eraLabel}</span>
            <span className="gx-hud-count">
              {pad2(idx)} <i>/</i> {pad2(total)}
            </span>
          </div>

          <button
            type="button"
            className={`gx-hud-card ${flying ? 'is-on' : ''}`}
            onClick={() => nearNode && select(nearNode.id)}
            aria-label={nearNode ? `Open ${nearNode.label}` : undefined}
          >
            <span className="gx-hud-kicker">now passing</span>
            <span className="gx-hud-name">{nearNode?.label}</span>
            {nearNode?.sub && <span className="gx-hud-sub">{nearNode.sub}</span>}
            <span className="gx-hud-period">{nearNode?.period}</span>
            <span className="gx-hud-open">▸ open the story</span>
          </button>

          <div className="gx-hud-axes">
            <span>← research · production →</span>
            <span>↑ models · infra ↓</span>
          </div>
        </div>

        <div className={`galaxy-overlay ${flying ? 'is-flown' : ''}`}>
          <Reveal className="slate">
            <strong>The Plane</strong> निर्देशांक तल
          </Reveal>
          <RevealTitle className="scene-title galaxy-title">
            A career is a flight through space.
          </RevealTitle>
          <Reveal as="p" className="prose galaxy-lede">
            Every star is a project, at its own coordinates in time. Scroll to fly from the origin —
            a mathematics degree — forward to today. The frame names each one as you pass; tap it for
            the full story.
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
