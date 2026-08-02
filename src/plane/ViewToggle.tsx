import './viewToggle.css'

export type PlaneView = 'flight' | 'index'

interface ViewToggleProps {
  view: PlaneView
  onChange: (v: PlaneView) => void
}

/** Subtle segmented switch: the immersive flight vs. the scannable index.
 *  The same control lives in the flight HUD and the index header, so the
 *  two views feel like one place seen two ways. */
export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="gx-toggle" role="tablist" aria-label="view">
      <button
        type="button"
        role="tab"
        aria-selected={view === 'flight'}
        className={view === 'flight' ? 'is-on' : ''}
        onClick={() => onChange('flight')}
      >
        Flight
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={view === 'index'}
        className={view === 'index' ? 'is-on' : ''}
        onClick={() => onChange('index')}
      >
        Index
      </button>
    </div>
  )
}
