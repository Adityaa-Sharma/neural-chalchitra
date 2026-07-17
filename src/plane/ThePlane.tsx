import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { useGSAP } from '@gsap/react'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { Reveal } from '../components/Reveal'
import { RevealTitle } from '../components/RevealTitle'
import { Eq } from '../components/Eq'
import { NODES, EDGES, RESULTANT, type PlaneNode } from './careerData'
import { px, py, VIEW_W, VIEW_H, CHAIN, NEIGHBORS } from './planeMath'
import { NodeDrawer } from './NodeDrawer'
import './ThePlane.css'

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, useGSAP)

const R: Record<string, number> = {
  origin: 7,
  education: 6.5,
  paper: 7,
  project: 7,
  work: 8,
  learning: 5.5,
  career: 11,
}

const GRID_STEP = 1 // semantic units

function nodeAria(n: PlaneNode): string {
  return `${n.label} — ${n.sub ?? n.kind} (${n.period.split('·')[0].trim()})`
}

export function ThePlane() {
  const rootRef = useRef<HTMLElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const [hovered, setHovered] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [derived, setDerived] = useState(false)
  const derivingRef = useRef(false)

  const activeId = hovered ?? selected
  const activeSet = activeId ? NEIGHBORS[activeId] : null

  // deep link: #node=<id> on load; keep hash in sync on select
  useEffect(() => {
    const m = window.location.hash.match(/node=([\w-]+)/)
    if (m && NODES.some((n) => n.id === m[1])) {
      setSelected(m[1])
      window.setTimeout(
        () => document.getElementById('plane')?.scrollIntoView({ block: 'start' }),
        60,
      )
    }
  }, [])

  const select = useCallback((id: string | null) => {
    setSelected(id)
    const url = id ? `#node=${id}` : '#plane'
    history.replaceState(null, '', url)
  }, [])

  // the daimon (and anything else) can open nodes via this event
  useEffect(() => {
    const onOpen = (e: Event) => {
      const id = (e as CustomEvent<string>).detail
      if (NODES.some((n) => n.id === id)) {
        select(id)
        document.getElementById('plane')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    window.addEventListener('plane:open', onOpen)
    return () => window.removeEventListener('plane:open', onOpen)
  }, [select])

  /* ————— constellation entrance ————— */
  useGSAP(
    () => {
      if (reducedMotion) return
      const tl = gsap.timeline({
        scrollTrigger: { trigger: svgRef.current, start: 'top 75%', once: true },
        defaults: { ease: 'power3.out' },
      })
      tl.from('.pl-grid', { opacity: 0, duration: 0.8 })
        .from('.pl-axis', { drawSVG: '50% 50%', duration: 0.9, stagger: 0.1 }, '-=0.4')
        .from('.pl-axis-label', { opacity: 0, duration: 0.6, stagger: 0.08 }, '-=0.4')
        .from(
          '.pl-node',
          {
            scale: 0,
            transformOrigin: 'center',
            duration: 0.55,
            ease: 'back.out(2.2)',
            stagger: { each: 0.07, from: 'start' },
          },
          '-=0.5',
        )
        .from('.pl-edge', { drawSVG: '0% 0%', opacity: 0, duration: 0.7, stagger: 0.05 }, '-=0.6')
        .from('.pl-label-g', { opacity: 0, duration: 0.7, stagger: 0.03 }, '-=0.5')
        .from('.pl-caption', { opacity: 0, y: 10, duration: 0.7 }, '-=0.3')
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  )

  /* ————— the resultant: tip-to-tail weighted sum ————— */
  const derive = useCallback(() => {
    if (derivingRef.current) return
    const svg = svgRef.current
    if (!svg) return

    if (derived) {
      // reset
      gsap.to('.pl-ghost, .pl-chain, .pl-chain-label, .pl-result', {
        opacity: 0,
        duration: 0.4,
        onComplete: () => {
          gsap.set('.pl-ghost, .pl-chain, .pl-result', { clearProps: 'all', drawSVG: '0% 0%' })
        },
      })
      svg.classList.remove('is-deriving')
      setDerived(false)
      return
    }

    derivingRef.current = true
    svg.classList.add('is-deriving')

    if (reducedMotion) {
      gsap.set('.pl-ghost', { opacity: 0.3, drawSVG: '0% 100%' })
      gsap.set('.pl-chain, .pl-chain-label', { opacity: 1, drawSVG: '0% 100%' })
      gsap.set('.pl-result', { opacity: 1, drawSVG: '0% 100%' })
      derivingRef.current = false
      setDerived(true)
      return
    }

    const tl = gsap.timeline({
      onComplete: () => {
        derivingRef.current = false
        setDerived(true)
      },
    })
    tl.to('.pl-ghost', { opacity: 0.3, duration: 0.4 })
      .fromTo(
        '.pl-ghost',
        { drawSVG: '0% 0%' },
        { drawSVG: '0% 100%', duration: 0.8, stagger: 0.12, ease: 'power2.inOut' },
        '<',
      )
    CHAIN.forEach((_, i) => {
      tl.fromTo(
        `.pl-chain[data-i="${i}"]`,
        { drawSVG: '0% 0%', opacity: 1 },
        { drawSVG: '0% 100%', duration: 0.55, ease: 'power2.inOut' },
      ).to(`.pl-chain-label[data-i="${i}"]`, { opacity: 1, duration: 0.25 }, '-=0.2')
    })
    tl.fromTo(
      '.pl-result',
      { drawSVG: '0% 0%', opacity: 1 },
      { drawSVG: '0% 100%', duration: 0.9, ease: 'power3.inOut' },
      '+=0.15',
    ).fromTo(
      '.pl-node[data-id="career"] .pl-halo',
      { opacity: 0.2 },
      { opacity: 0.65, scale: 1.35, transformOrigin: 'center', duration: 0.5, yoyo: true, repeat: 1 },
      '-=0.3',
    )
  }, [derived, reducedMotion])

  const selectedNode = useMemo(() => NODES.find((n) => n.id === selected) ?? null, [selected])

  return (
    <section
      className={`scene plane-scene ${selected ? 'has-selection' : ''}`}
      id="plane"
      ref={rootRef}
    >
      <div className="scene-inner plane-inner">
        <Reveal className="slate">
          <strong>The Plane</strong> निर्देशांक तल
        </Reveal>

        <RevealTitle className="scene-title">
          Every project is a vector. The career is their sum.
        </RevealTitle>

        <Reveal as="p" className="prose">
          I have a mathematics degree, so my résumé lives on a plane. Right means production,
          left means research; up means models, down means infrastructure.{' '}
          <strong>Tap any star for the full story</strong> — or derive the career vector and
          watch the sum land.
        </Reveal>

        <div className="plane-wrap">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className={activeId ? 'has-focus' : ''}
            role="group"
            aria-label="Career map: projects and roles as points on a plane. Use Tab to move between nodes, Enter to open details."
          >
            <defs>
              <marker id="pl-arr-teal" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--teal)" />
              </marker>
              <marker id="pl-arr-gold" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--gold)" />
              </marker>
            </defs>

            {/* faint grid */}
            <g className="pl-grid">
              {Array.from({ length: 9 }, (_, i) => i - 4).map((u) => (
                <g key={u}>
                  <line x1={px(u * GRID_STEP)} y1={py(-3.4)} x2={px(u * GRID_STEP)} y2={py(3.5)} />
                  {u >= -3 && u <= 3 && (
                    <line x1={px(-4.2)} y1={py(u * GRID_STEP)} x2={px(4.4)} y2={py(u * GRID_STEP)} />
                  )}
                </g>
              ))}
            </g>

            {/* axes + whispered labels */}
            <g className="pl-axes">
              <line className="pl-axis" x1={px(-4.2)} y1={py(0)} x2={px(4.4)} y2={py(0)} />
              <line className="pl-axis" x1={px(0)} y1={py(-3.4)} x2={px(0)} y2={py(3.5)} />
              <text className="pl-axis-label" x={px(4.35)} y={py(0) - 10} textAnchor="end">
                production →
              </text>
              <text className="pl-axis-label" x={px(-4.15)} y={py(0) - 10}>
                ← research
              </text>
              <text className="pl-axis-label" x={px(0) + 10} y={py(3.42)}>
                models ↑
              </text>
              <text className="pl-axis-label" x={px(0) + 10} y={py(-3.32)}>
                infrastructure ↓
              </text>
            </g>

            {/* constellation edges */}
            <g className="pl-edges">
              {EDGES.map(([a, b]) => {
                const na = NODES.find((n) => n.id === a)!
                const nb = NODES.find((n) => n.id === b)!
                const lit = activeSet ? activeSet.has(a) && activeSet.has(b) : false
                return (
                  <path
                    key={`${a}~${b}`}
                    className={`pl-edge ${lit ? 'is-lit' : ''}`}
                    d={`M ${px(na.x)} ${py(na.y)} L ${px(nb.x)} ${py(nb.y)}`}
                  />
                )
              })}
            </g>

            {/* resultant machinery (hidden until derived) */}
            <g className="pl-resultant" aria-hidden="true">
              {RESULTANT.map(({ id }) => {
                const n = NODES.find((nn) => nn.id === id)!
                return (
                  <line
                    key={`ghost-${id}`}
                    className="pl-ghost"
                    x1={px(0)}
                    y1={py(0)}
                    x2={px(n.x)}
                    y2={py(n.y)}
                    markerEnd="url(#pl-arr-teal)"
                  />
                )
              })}
              {CHAIN.map((seg, i) => (
                <g key={`chain-${i}`}>
                  <line
                    className="pl-chain"
                    data-i={i}
                    x1={px(seg.from[0])}
                    y1={py(seg.from[1])}
                    x2={px(seg.to[0])}
                    y2={py(seg.to[1])}
                    markerEnd="url(#pl-arr-teal)"
                  />
                  <text
                    className="pl-chain-label"
                    data-i={i}
                    x={(px(seg.from[0]) + px(seg.to[0])) / 2 + 8}
                    y={(py(seg.from[1]) + py(seg.to[1])) / 2 - 6}
                  >
                    {seg.w}·{seg.id}
                  </text>
                </g>
              ))}
              <line
                className="pl-result"
                x1={px(0)}
                y1={py(0)}
                x2={px(3.13)}
                y2={py(0.79)}
                markerEnd="url(#pl-arr-gold)"
              />
            </g>

            {/* the stars */}
            <g className="pl-nodes">
              {NODES.map((n) => {
                const isActive = activeId === n.id
                const isNeighbor = !!activeSet?.has(n.id) && !isActive
                const r = R[n.kind]
                return (
                  <g
                    key={n.id}
                    className={`pl-node pl-${n.kind} ${isActive ? 'is-active' : ''} ${
                      isNeighbor ? 'is-neighbor' : ''
                    }`}
                    data-id={n.id}
                    transform={`translate(${px(n.x)}, ${py(n.y)})`}
                    role="button"
                    tabIndex={0}
                    aria-label={nodeAria(n)}
                    onMouseEnter={() => setHovered(n.id)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(n.id)}
                    onBlur={() => setHovered(null)}
                    onClick={() => select(n.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        select(n.id)
                      }
                    }}
                  >
                    <circle className="pl-hit" r={22} />
                    <circle className="pl-halo" r={r * 2.6} />
                    <circle className="pl-core" r={r} />
                    {n.kind === 'origin' && <circle className="pl-origin-ring" r={r + 5} />}
                    <g className="pl-label-g">
                      <text className="pl-label" y={n.y >= 0 ? -(r * 2.6 + 6) : r * 2.6 + 16}>
                        {n.label}
                      </text>
                      {n.sub && (
                        <text
                          className="pl-sub"
                          y={n.y >= 0 ? -(r * 2.6 + 6) + 13 : r * 2.6 + 29}
                        >
                          {n.sub}
                        </text>
                      )}
                    </g>
                  </g>
                )
              })}
            </g>
          </svg>

          <div className="pl-caption">
            <button className="pl-derive" onClick={derive}>
              {derived ? '↺ reset' : '∑ derive the career vector'}
            </button>
            <div className="pl-formula">
              <Eq tex="\text{career} \;=\; \textstyle\sum_i w_i\,\vec{p}_i" />
              <span>every project is a vector — the job is their weighted sum</span>
            </div>
          </div>
        </div>
      </div>

      <NodeDrawer
        node={selectedNode}
        onClose={() => select(null)}
        onNav={(dir) => {
          if (!selectedNode) return
          const i = NODES.findIndex((n) => n.id === selectedNode.id)
          const next = NODES[(i + dir + NODES.length) % NODES.length]
          select(next.id)
        }}
      />
    </section>
  )
}
