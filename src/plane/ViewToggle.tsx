import './viewToggle.css'

export type PlaneView = 'flight' | 'index'

interface ViewToggleProps {
  view: PlaneView
  onChange: (v: PlaneView) => void
}

/** Segmented switch: the scannable index (default) vs. the immersive flight.
 *  While the index is showing, the Flight chip glows — the invitation into
 *  the graphical atmosphere is unmissable but never in the way. */
export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="gx-toggle" role="tablist" aria-label="view">
      <button
        type="button"
        role="tab"
        aria-selected={view === 'index'}
        className={view === 'index' ? 'is-on' : ''}
        onClick={() => onChange('index')}
      >
        Index
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={view === 'flight'}
        className={view === 'flight' ? 'is-on' : 'is-glow'}
        onClick={() => onChange('flight')}
      >
        <span aria-hidden="true">✦</span> 3D flight
      </button>
    </div>
  )
}
