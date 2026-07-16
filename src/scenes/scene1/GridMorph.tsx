import { useCallback, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { Eq } from '../../components/Eq'
import './GridMorph.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/* Same matrix as the eigen explorer — Scene 1 has one protagonist. */
const A = [
  [2, 1],
  [1, 2],
]

const GRID_EXTENT = 8
const UNIT = 46 // px per grid unit at t = 0

/** M(t) = I + t(A − I): identity at t=0, the full transform at t=1. */
function matrixAt(t: number): [number, number, number, number] {
  return [
    1 + t * (A[0][0] - 1),
    t * A[0][1],
    t * A[1][0],
    1 + t * (A[1][1] - 1),
  ]
}

export function GridMorph() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tRef = useRef(0)
  const reducedMotion = usePrefersReducedMotion()

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr
      canvas.height = h * dpr
    }

    const t = tRef.current
    const [a, b, c, d] = matrixAt(t)
    const cx = w / 2
    const cy = h / 2

    const px = (x: number, y: number): [number, number] => [
      cx + (a * x + b * y) * UNIT,
      cy - (c * x + d * y) * UNIT,
    ]

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const styles = getComputedStyle(canvas)
    const lineColor = styles.getPropertyValue('--line').trim() || '#2e2718'
    const goldColor = styles.getPropertyValue('--gold').trim() || '#e8b44f'
    const tealColor = styles.getPropertyValue('--teal').trim() || '#63d8c6'
    const faintColor = styles.getPropertyValue('--ink-faint').trim() || '#6e675a'

    // grid lines carried by the transform
    ctx.lineWidth = 1
    for (let i = -GRID_EXTENT; i <= GRID_EXTENT; i++) {
      ctx.strokeStyle = i === 0 ? faintColor : lineColor
      ctx.beginPath()
      ctx.moveTo(...px(i, -GRID_EXTENT))
      ctx.lineTo(...px(i, GRID_EXTENT))
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(...px(-GRID_EXTENT, i))
      ctx.lineTo(...px(GRID_EXTENT, i))
      ctx.stroke()
    }

    // basis vectors î and ĵ
    const arrow = (tx: number, ty: number, color: string) => {
      const [ex, ey] = px(tx, ty)
      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(ex, ey)
      ctx.stroke()
      const ang = Math.atan2(ey - cy, ex - cx)
      ctx.beginPath()
      ctx.moveTo(ex, ey)
      ctx.lineTo(ex - 11 * Math.cos(ang - 0.42), ey - 11 * Math.sin(ang - 0.42))
      ctx.lineTo(ex - 11 * Math.cos(ang + 0.42), ey - 11 * Math.sin(ang + 0.42))
      ctx.closePath()
      ctx.fill()
    }
    arrow(1, 0, goldColor)
    arrow(0, 1, tealColor)
  }, [])

  // redraw on resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(draw)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [draw])

  // reduced motion: show the completed transform, no scrubbing
  useEffect(() => {
    if (reducedMotion) {
      tRef.current = 1
      draw()
    }
  }, [reducedMotion, draw])

  useGSAP(
    () => {
      if (reducedMotion) return
      // fromTo, not to: if reduce-motion was on earlier, tRef sits at 1 and a
      // plain .to() would tween 1 → 1, freezing the grid fully sheared.
      gsap.fromTo(
        tRef,
        { current: 0 },
        {
          current: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: wrapRef.current,
            start: 'top 75%',
            end: 'center 40%',
            scrub: 0.4,
          },
          onUpdate: draw,
        },
      )
    },
    { scope: wrapRef, dependencies: [reducedMotion] },
  )

  return (
    <div className="grid-morph" ref={wrapRef}>
      <canvas ref={canvasRef} className="grid-morph-canvas" aria-hidden="true" />
      <div className="grid-morph-legend">
        <Eq tex="M(t) = I + t\,(A - I)" />
        <p>
          Keep scrolling — <Eq tex="t" /> goes from 0 to 1 and <strong>space itself bends</strong>.
          The gold arrow is <Eq tex="\hat{\imath}" />, the teal one <Eq tex="\hat{\jmath}" />. A
          matrix is nothing more than where it sends the basis.
        </p>
      </div>
    </div>
  )
}
