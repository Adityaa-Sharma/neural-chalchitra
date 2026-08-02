import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import * as THREE from 'three'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { Reveal } from '../components/Reveal'
import { RevealTitle } from '../components/RevealTitle'
import { NODES, type PlaneNode } from './careerData'
import { galaxyNodeById, stationIds, STATIONS } from './galaxy/galaxyData'
import { NodeDrawer } from './NodeDrawer'
import { ProjectIndex } from './ProjectIndex'
import { ViewToggle, type PlaneView } from './ViewToggle'
import './ThePlaneGalaxy.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const Galaxy = lazy(() => import('./galaxy/Galaxy'))

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
  if (!use3D) return <IndexFallback />
  return <Galaxy3D />
}

/** Reduced-motion / no-WebGL default: the scannable card index is the
 *  accessible baseline — the galaxy is a progressive enhancement over it. */
function IndexFallback() {
  const [selected, setSelected] = useState<string | null>(null)

  const open = useCallback((id: string) => {
    setSelected(id)
    history.replaceState(null, '', `#node=${id}`)
  }, [])
  const close = useCallback(() => {
    setSelected(null)
    history.replaceState(null, '', '#plane')
  }, [])

  useEffect(() => {
    const onOpen = (e: Event) => {
      const id = (e as CustomEvent<string>).detail
      if (NODES.some((n) => n.id === id)) open(id)
    }
    window.addEventListener('plane:open', onOpen)
    return () => window.removeEventListener('plane:open', onOpen)
  }, [open])

  const node = NODES.find((n) => n.id === selected) ?? null

  return (
    <section id="plane" className="pindex-page">
      <ProjectIndex onOpen={open} />
      <NodeDrawer
        node={node as PlaneNode | null}
        onClose={close}
        onNav={(dir) => {
          if (!node) return
          const list = NODES
          const i = list.findIndex((n) => n.id === node.id)
          open(list[(i + dir + list.length) % list.length].id)
        }}
      />
    </section>
  )
}

function Galaxy3D() {
  const rootRef = useRef<HTMLElement>(null)
  const scrollRef = useRef(0)
  const pointerRef = useRef({ x: 0, y: 0 })
  const focusRef = useRef<THREE.Vector3 | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  // the chapter (station) the camera is paused at — grounds the whole HUD
  const [station, setStation] = useState(0)
  // immersive flight vs. the scannable card index
  // INDEX FIRST (owner's priority): the scannable org view is the default;
  // the 3D flight is the opt-in atmosphere behind a highlighted chip. three.js
  // doesn't even load until someone chooses to fly.
  const [view, setView] = useState<PlaneView>('index')

  const starCount = useMemo(
    () => (typeof window !== 'undefined' && window.innerWidth < 768 ? 700 : 1300),
    [],
  )

  const switchView = useCallback((v: PlaneView) => {
    setView(v)
    // land at the section top in the new mode, with fresh trigger positions
    requestAnimationFrame(() => {
      rootRef.current?.scrollIntoView({ block: 'start' })
      ScrollTrigger.refresh()
    })
  }, [])

  // scroll → flight progress (0..1) across the tall section (flight mode only)
  useGSAP(
    () => {
      if (view !== 'flight') return
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
    { scope: rootRef, dependencies: [view] },
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

  // HUD grounding data — always reflects the chapter the camera is paused at
  const chapter = STATIONS[station]
  const nearSet = useMemo(() => stationIds(station), [station])
  const total = STATIONS.length
  const flying = station > 0
  const pad2 = (n: number) => String(n).padStart(2, '0')

  const drawer = (
    <NodeDrawer
      node={node as PlaneNode | null}
      onClose={closeDrawer}
      onNav={(dir) => {
        if (!node) return
        const list = NODES
        const i = list.findIndex((n) => n.id === node.id)
        select(list[(i + dir + list.length) % list.length].id)
      }}
    />
  )

  // DEFAULT: the scannable index in normal document flow. the flight (and
  // its three.js chunk) exists only after the user opts in via the chip.
  if (view === 'index') {
    return (
      <section className="pindex-page" id="plane" ref={rootRef}>
        <ProjectIndex onOpen={select} view={view} onView={switchView} />
        {drawer}
      </section>
    )
  }

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
              nearSet={nearSet}
              litSet={nearSet}
              onSelect={select}
              onHover={setHovered}
              onStation={setStation}
              reduced={false}
              starCount={starCount}
            />
          </Suspense>
        </div>

        {/* persistent metadata layer — keeps the star-field legible: the frame
            always says which chapter you're in. (the sidewave move.) */}
        <div className="gx-hud">
          <div className="gx-hud-bar">
            <span className="gx-hud-mark">NEURAL CHALCHITRA</span>
            <span className="gx-hud-tag">/ THE WORK</span>
            <span className="gx-hud-era">{chapter.title}</span>
            <span className="gx-hud-count">
              {pad2(station + 1)} <i>/</i> {pad2(total)}
            </span>
            <ViewToggle view={view} onChange={switchView} />
          </div>

          {/* chapter card — the station the camera is paused at */}
          <div className={`gx-hud-card ${flying ? 'is-on' : ''}`}>
            <span className="gx-hud-kicker">chapter {pad2(station + 1)}</span>
            <span className="gx-hud-name">{chapter.title}</span>
            <span className="gx-hud-sub">{chapter.meta}</span>
            <span className="gx-hud-open">▸ tap a star for the story</span>
          </div>
        </div>

        <div className={`galaxy-overlay ${flying ? 'is-flown' : ''}`}>
          <Reveal className="slate">
            <strong>The Plane</strong> निर्देशांक तल
          </Reveal>
          <RevealTitle className="scene-title galaxy-title">
            Every star here is something I built.
          </RevealTitle>
          <Reveal as="p" className="prose galaxy-lede">
            Scroll to fly from the origin — a mathematics degree — through five years of agents,
            fine-tunes and production systems, ending at the role I hold now. The frame names each
            star as you pass; tap it for the full story.
          </Reveal>
          <Reveal as="p" className="galaxy-scrollcue" aria-hidden="true">
            scroll to fly ↓
          </Reveal>
        </div>
      </div>

      {drawer}
    </section>
  )
}
