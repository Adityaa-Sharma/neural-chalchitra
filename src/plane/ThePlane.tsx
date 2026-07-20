import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { useGSAP } from '@gsap/react'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { Reveal } from '../components/Reveal'
import { RevealTitle } from '../components/RevealTitle'
import { Eq } from '../components/Eq'
import { NODES, type PlaneNode } from './careerData'
import { ROLES, resultantOf } from './roles'
import { px, py, VIEW_W, VIEW_H, FULL_VIEWBOX, viewBoxOf, chainOf, litSet } from './planeMath'
import { NodeDrawer } from './NodeDrawer'
import './ThePlane.css'

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, MotionPathPlugin, useGSAP)

/* deterministic star field so the sky is stable across renders */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface BgStar {
  x: number
  y: number
  r: number
  o: number
  teal: boolean
}
function makeLayer(seed: number, n: number, maxR: number): BgStar[] {
  const rand = mulberry32(seed)
  return Array.from({ length: n }, () => ({
    x: rand() * VIEW_W,
    y: rand() * VIEW_H,
    r: 0.4 + rand() * maxR,
    o: 0.15 + rand() * 0.5,
    teal: rand() > 0.78,
  }))
}

const STAR_R: Record<string, number> = {
  origin: 8,
  education: 5,
  paper: 6.5,
  project: 6,
  work: 6,
  learning: 4.5,
  career: 6,
}

export function ThePlane() {
  const rootRef = useRef<HTMLElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  const [roleId, setRoleId] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const role = useMemo(() => ROLES.find((r) => r.id === roleId) ?? null, [roleId])
  const lit = useMemo(() => litSet(role), [role])
  const chain = useMemo(() => (role ? chainOf(role) : []), [role])

  const layers = useMemo(
    () => [makeLayer(7, 90, 1.1), makeLayer(23, 55, 1.6), makeLayer(51, 28, 2.4)],
    [],
  )

  /* parallax on pointer move */
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap || reducedMotion) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect()
      const nx = (e.clientX - r.left) / r.width - 0.5
      const ny = (e.clientY - r.top) / r.height - 0.5
      if (raf) return
      raf = requestAnimationFrame(() => {
        wrap.style.setProperty('--px', String(nx))
        wrap.style.setProperty('--py', String(ny))
        raf = 0
      })
    }
    wrap.addEventListener('pointermove', onMove)
    return () => {
      wrap.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [reducedMotion])

  /* daimon can still open a project card */
  useEffect(() => {
    const onOpen = (e: Event) => {
      const id = (e as CustomEvent<string>).detail
      if (NODES.some((n) => n.id === id)) {
        setSelectedNode(id)
        document.getElementById('plane')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    window.addEventListener('plane:open', onOpen)
    return () => window.removeEventListener('plane:open', onOpen)
  }, [])

  /* entrance — the reveal tweens are BUILT only when the sky scrolls into view
     (or after a fallback timeout), so elements are never left hidden if the
     observer misses. Stars are visible by CSS default until then. */
  useGSAP(
    () => {
      if (reducedMotion || !wrapRef.current) return
      let built = false
      const build = () => {
        if (built) return
        built = true
        // Stars stay visible by CSS default; the entrance only pops them in
        // place (scale, never opacity) so a stalled tween can never hide them.
        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .from('.sky-layer', { opacity: 0, duration: 1.1, stagger: 0.12 })
          .from(
            '.star-core, .star-halo',
            { scale: 0.2, transformOrigin: 'center', duration: 0.6, ease: 'back.out(2)', stagger: { each: 0.04, from: 'center' } },
            '-=0.7',
          )
          .from('.star-label', { opacity: 0, duration: 0.7, stagger: 0.02 }, '-=0.3')
          .from('.role-item', { opacity: 0, x: 16, duration: 0.5, stagger: 0.08 }, '-=0.9')
          .from('.plane-caption', { opacity: 0, y: 10, duration: 0.7 }, '-=0.3')
      }
      const io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            build()
            io.disconnect()
          }
        },
        { threshold: 0.15 },
      )
      io.observe(wrapRef.current)
      const fallback = window.setTimeout(build, 2600)
      return () => {
        io.disconnect()
        window.clearTimeout(fallback)
      }
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  )

  /* camera + vector summing on role select */
  useGSAP(
    () => {
      const svg = svgRef.current
      if (!svg) return
      if (!role) {
        gsap.to(svg, { attr: { viewBox: FULL_VIEWBOX }, duration: 0.9, ease: 'power3.inOut' })
        return
      }
      if (reducedMotion) {
        gsap.set(svg, { attr: { viewBox: viewBoxOf(role) } })
        gsap.set('.vseg, .vresult', { drawSVG: '100%', opacity: 1 })
        return
      }
      const tl = gsap.timeline()
      tl.to(svg, { attr: { viewBox: viewBoxOf(role) }, duration: 1.0, ease: 'power3.inOut' }, 0)
      chain.forEach((_, i) => {
        const at = i === 0 ? 0.4 : '>-0.12'
        tl.fromTo(`.vseg[data-i="${i}"]`, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.5, ease: 'power2.out' }, at)
        tl.set(`.vcomet[data-i="${i}"]`, { opacity: 1 }, '<')
        tl.to(`.vcomet[data-i="${i}"]`, { motionPath: { path: `#seg-${role.id}-${i}`, start: 0, end: 1 }, duration: 0.5, ease: 'power2.out' }, '<')
        tl.to(`.vcomet[data-i="${i}"]`, { opacity: 0, duration: 0.18 }, '>-0.05')
      })
      tl.fromTo('.vresult', { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.7, ease: 'back.out(1.5)' }, '>-0.05')
      tl.set('.vcomet-r', { opacity: 1 }, '<')
      tl.to('.vcomet-r', { motionPath: { path: `#seg-${role.id}-r`, start: 0, end: 1 }, duration: 0.7, ease: 'back.out(1.5)' }, '<')
      tl.to('.vcomet-r', { opacity: 0, duration: 0.2 })
      tl.fromTo('.vflare', { scale: 0.9, opacity: 0.85, transformOrigin: 'center' }, { scale: 1.7, opacity: 0, duration: 0.6, ease: 'power2.out' }, '>-0.35')
    },
    { scope: rootRef, dependencies: [roleId, reducedMotion] },
  )

  const toggleRole = useCallback(
    (id: string) => setRoleId((cur) => (cur === id ? null : id)),
    [],
  )

  const selectNode = useCallback((id: string | null) => {
    setSelectedNode(id)
    history.replaceState(null, '', id ? `#node=${id}` : '#plane')
  }, [])

  const node = useMemo(() => NODES.find((n) => n.id === selectedNode) ?? null, [selectedNode])
  const resPt = role ? resultantOf(role) : null

  return (
    <section className={`scene plane-scene ${role ? 'is-focused' : ''}`} id="plane" ref={rootRef}>
      <div className="scene-inner">
        <Reveal className="slate">
          <strong>The Plane</strong> निर्देशांक तल
        </Reveal>
        <RevealTitle className="scene-title">A career is a sum of vectors.</RevealTitle>
        <Reveal as="p" className="prose">
          Every project I&rsquo;ve built is a star with a direction. Pick a role on the right and
          watch its vectors add, tip to tail, until they land on where I stood.
        </Reveal>
      </div>

      <div className="plane-layout">
        <div className="plane-wrap" ref={wrapRef}>
          {/* ambient depth: nebula + parallax star layers */}
          <div className="nebula" aria-hidden="true" />
          {layers.map((stars, li) => (
            <svg
              key={li}
              className="sky-layer"
              style={{ '--depth': li } as React.CSSProperties}
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              {stars.map((s, i) => (
                <circle
                  key={i}
                  cx={s.x}
                  cy={s.y}
                  r={s.r}
                  fill={s.teal ? 'var(--teal)' : '#fff4dc'}
                  opacity={s.o}
                />
              ))}
            </svg>
          ))}

          <svg
            ref={svgRef}
            className="plane-svg"
            viewBox={FULL_VIEWBOX}
            preserveAspectRatio="xMidYMid slice"
            role="group"
            aria-label="Career star chart"
          >
            <defs>
              <radialGradient id="halo-gold">
                <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.9" />
                <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="halo-teal">
                <stop offset="0%" stopColor="var(--teal)" stopOpacity="0.85" />
                <stop offset="100%" stopColor="var(--teal)" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="halo-white">
                <stop offset="0%" stopColor="#fff4dc" stopOpacity="1" />
                <stop offset="100%" stopColor="#fff4dc" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="flare-grad">
                <stop offset="0%" stopColor="#fff4dc" stopOpacity="1" />
                <stop offset="40%" stopColor="var(--gold)" stopOpacity="0.7" />
                <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
              </radialGradient>
              <filter id="soft-glow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <marker id="arr-gold" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0 1 L9 5 L0 9 z" fill="var(--gold)" />
              </marker>
              {/* per-segment gradients, locked to real geometry */}
              {role &&
                chain.map((seg, i) => (
                  <linearGradient
                    key={i}
                    id={`vg-${role.id}-${i}`}
                    gradientUnits="userSpaceOnUse"
                    x1={px(seg.from[0])}
                    y1={py(seg.from[1])}
                    x2={px(seg.to[0])}
                    y2={py(seg.to[1])}
                  >
                    <stop offset="0%" stopColor="var(--teal)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="var(--teal)" stopOpacity="1" />
                  </linearGradient>
                ))}
              {role && resPt && (
                <linearGradient
                  id={`vg-${role.id}-r`}
                  gradientUnits="userSpaceOnUse"
                  x1={px(0)}
                  y1={py(0)}
                  x2={px(resPt[0])}
                  y2={py(resPt[1])}
                >
                  <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#fff4dc" stopOpacity="1" />
                </linearGradient>
              )}
            </defs>

            {/* faint radial magnitude rings instead of a grid */}
            <g className="mag-rings" aria-hidden="true">
              {[1, 2, 3].map((k) => (
                <circle key={k} className="mag-ring" cx={px(0)} cy={py(0)} r={k * 96} />
              ))}
            </g>

            {/* whispered directional captions */}
            <g className="axis-caps" aria-hidden="true">
              <text x={px(4.2)} y={py(0) - 8} textAnchor="end">production →</text>
              <text x={px(-4.2)} y={py(0) - 8}>← research</text>
              <text x={px(0) + 8} y={py(3.5)}>models ↑</text>
              <text x={px(0) + 8} y={py(-3.4)}>infrastructure ↓</text>
            </g>

            {/* vectors for the focused role */}
            {role && (
              <g className="vectors" key={role.id}>
                {chain.map((seg, i) => (
                  <g key={i}>
                    <path
                      id={`seg-${role.id}-${i}`}
                      className="vseg-glow"
                      d={`M ${px(seg.from[0])} ${py(seg.from[1])} L ${px(seg.to[0])} ${py(seg.to[1])}`}
                    />
                    <path
                      className="vseg"
                      data-i={i}
                      d={`M ${px(seg.from[0])} ${py(seg.from[1])} L ${px(seg.to[0])} ${py(seg.to[1])}`}
                      stroke={`url(#vg-${role.id}-${i})`}
                    />
                    <circle className="vcomet" data-i={i} r={3.2} />
                  </g>
                ))}
                {resPt && (
                  <>
                    <path
                      id={`seg-${role.id}-r`}
                      d={`M ${px(0)} ${py(0)} L ${px(resPt[0])} ${py(resPt[1])}`}
                      style={{ visibility: 'hidden' }}
                    />
                    <path
                      className="vresult"
                      d={`M ${px(0)} ${py(0)} L ${px(resPt[0])} ${py(resPt[1])}`}
                      stroke={`url(#vg-${role.id}-r)`}
                      markerEnd="url(#arr-gold)"
                    />
                    <circle className="vcomet-r" r={4.5} cx={px(0)} cy={py(0)} />
                    <circle className="vflare" cx={px(resPt[0])} cy={py(resPt[1])} r={26} fill="url(#flare-grad)" />
                  </>
                )}
              </g>
            )}

            {/* role destination stars */}
            <g className="role-stars">
              {ROLES.map((r) => {
                const [rx, ry] = resultantOf(r)
                const on = roleId === r.id
                return (
                  <g
                    key={r.id}
                    className={`star role-star ${on ? 'is-on' : ''} ${role && !on ? 'is-dim' : ''}`}
                    transform={`translate(${px(rx)}, ${py(ry)})`}
                    onClick={() => toggleRole(r.id)}
                    role="button"
                    tabIndex={0}
                    aria-label={`role: ${r.title} at ${r.org}`}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggleRole(r.id))}
                  >
                    <circle className="star-halo" r={26} fill="url(#halo-gold)" />
                    <circle className="star-core" r={9} fill="var(--gold)" filter="url(#soft-glow)" />
                    {on && (
                      <text className="role-star-label" y={-34} textAnchor="middle">
                        {r.org}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>

            {/* project / paper stars — the sky */}
            <g className="project-stars">
              {NODES.filter((n) => n.kind !== 'career').map((n) => {
                const r = STAR_R[n.kind] ?? 6
                const dim = role ? !lit.has(n.id) : false
                const gold = n.kind === 'origin' || n.kind === 'education' || n.kind === 'work'
                const grad = n.kind === 'origin' ? 'halo-white' : gold ? 'halo-gold' : 'halo-teal'
                const core = n.kind === 'origin' ? '#fff4dc' : gold ? 'var(--gold)' : 'var(--teal)'
                return (
                  <g
                    key={n.id}
                    className={`star project-star ${dim ? 'is-dim' : ''} ${role && lit.has(n.id) ? 'is-lit' : ''}`}
                    style={{ '--tw': (mulberry32(Math.floor(n.id.length * 97 + Math.abs(n.x) * 13))() * 2.5 + 2.5).toFixed(2) + 's' } as React.CSSProperties}
                    transform={`translate(${px(n.x)}, ${py(n.y)})`}
                    onClick={() => selectNode(n.id)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${n.label} — ${n.sub ?? n.kind}`}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), selectNode(n.id))}
                  >
                    <circle className="star-halo" r={r * 2.6} fill={`url(#${grad})`} />
                    <circle className="star-core" r={r} fill={core} filter="url(#soft-glow)" />
                    <text className="star-label" y={-(r * 2.6 + 5)} textAnchor="middle">
                      {n.label}
                    </text>
                  </g>
                )
              })}
            </g>

          </svg>

          {/* vignette overlay (DOM, so it stays put when the camera zooms) */}
          <div className="vignette" aria-hidden="true" />

          <div className="plane-caption">
            <Eq tex="\vec{r}_{\text{role}} \;=\; \textstyle\sum_i w_i\,\vec{p}_i" />
            <span>{role ? `${role.title} · ${role.org}` : 'pick a role to draw its vectors'}</span>
          </div>
        </div>

        {/* the roles rail */}
        <aside className="role-rail" aria-label="roles">
          <div className="role-rail-head">ROLES</div>
          {ROLES.map((r) => (
            <button
              key={r.id}
              className={`role-item ${roleId === r.id ? 'is-active' : ''}`}
              onClick={() => toggleRole(r.id)}
            >
              <span className="role-item-title">{r.title}</span>
              <span className="role-item-org">{r.org}</span>
              <span className="role-item-kicker">{r.kicker}</span>
              <span className="role-item-period">{r.period}</span>
            </button>
          ))}
          {role && (
            <p className="role-blurb" key={role.id}>
              {role.blurb}
            </p>
          )}
        </aside>
      </div>

      <NodeDrawer
        node={node as PlaneNode | null}
        onClose={() => selectNode(null)}
        onNav={(dir) => {
          if (!node) return
          const list = NODES.filter((n) => n.kind !== 'career')
          const i = list.findIndex((n) => n.id === node.id)
          selectNode(list[(i + dir + list.length) % list.length].id)
        }}
      />
    </section>
  )
}
