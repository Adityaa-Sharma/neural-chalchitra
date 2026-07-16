import { Mafs, Coordinates, Vector, Theme, useMovablePoint } from 'mafs'
import 'mafs/core.css'
import { Eq } from '../../components/Eq'
import './EigenExplorer.css'

/* The matrix everything in Scene 1 revolves around.
   Symmetric, so its eigenvectors are orthogonal: along y = x (λ = 3)
   and y = -x (λ = 1) — findable by feel. */
const A = [
  [2, 1],
  [1, 2],
]

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

export function EigenExplorer() {
  const v = useMovablePoint([1.8, -0.6], {
    color: '#e8b44f',
    constrain: ([x, y]) => [clamp(x, -3.4, 3.4), clamp(y, -2.4, 2.4)],
  })

  const [x, y] = v.point
  const av: [number, number] = [A[0][0] * x + A[0][1] * y, A[1][0] * x + A[1][1] * y]

  const lenV = Math.hypot(x, y)
  const lenAv = Math.hypot(av[0], av[1])
  // sin of the angle between v and Av — zero when v is an eigenvector
  const sinAngle = lenV > 0.15 && lenAv > 0.15 ? Math.abs(x * av[1] - y * av[0]) / (lenV * lenAv) : 1
  const aligned = sinAngle < 0.045
  const lambda = aligned ? (x * av[0] + y * av[1] > 0 ? lenAv / lenV : -lenAv / lenV) : null

  return (
    <div className={`eigen-explorer ${aligned ? 'is-aligned' : ''}`}>
      <div className="eigen-canvas">
        <Mafs viewBox={{ x: [-4, 4], y: [-3, 3] }} height={420}>
          <Coordinates.Cartesian subdivisions={2} />
          <Vector tip={av} color={aligned ? '#e8b44f' : Theme.blue} />
          <Vector tip={v.point} color="#e8b44f" />
          {v.element}
        </Mafs>
        <div className="eigen-readout" aria-live="polite">
          {aligned ? (
            <>
              <Eq tex={`A\\vec{v} = ${lambda!.toFixed(1)}\\,\\vec{v}`} />
              <span className="eigen-found">eigenvector found</span>
            </>
          ) : (
            <Eq tex="A\vec{v} \ne \lambda\vec{v}" />
          )}
        </div>
      </div>

      <div className="eigen-caption">
        <Eq
          display
          tex="A = \begin{bmatrix} 2 & 1 \\ 1 & 2 \end{bmatrix}"
        />
        <p>
          Drag the <strong className="c-gold">gold vector</strong>. The{' '}
          <strong className="c-teal">teal one</strong> is <Eq tex="A\vec{v}" /> — where the matrix
          sends it. Most directions get knocked off course. But two directions refuse to turn:
          the matrix can only stretch them. Find one, and you have found an{' '}
          <strong>eigenvector</strong>.
        </p>
        <p className="eigen-hint">hint: try the diagonals.</p>
      </div>
    </div>
  )
}
