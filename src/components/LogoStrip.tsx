import { asset } from '../lib/asset'
import './LogoStrip.css'

/* Education and employers — real marks, quietly. Marks that don't contain
 * their own name get a mono label beside them; marks that are already a
 * solid colour tile (Savills) sit bare, without the light chip. */
const MARKS: { src: string; alt: string; label?: string; href: string; bare?: boolean }[] = [
  {
    src: 'assets/logos/iiitl.png',
    alt: 'IIIT Lucknow',
    label: 'IIIT Lucknow',
    href: 'https://iiitl.ac.in/',
  },
  { src: 'assets/logos/pgagi.png', alt: 'PG-AGI', label: 'PG-AGI', href: 'https://pgagi.in/' },
  {
    src: 'assets/logos/datasmith.svg',
    alt: 'Datasmith.ai',
    label: 'Datasmith.ai',
    href: 'https://www.data-smith.ai/',
  },
  { src: 'assets/logos/savills.png', alt: 'Savills', href: 'https://www.savills.com/', bare: true },
]

export function LogoStrip() {
  return (
    <div className="logo-strip">
      <span className="logo-strip-caption">education · employers</span>
      <ul>
        {MARKS.map((m) => (
          <li key={m.alt}>
            <a href={m.href} target="_blank" rel="noreferrer" aria-label={m.alt}>
              <span className={`logo-chip ${m.bare ? 'is-bare' : ''}`}>
                <img src={asset(m.src)} alt={m.alt} loading="lazy" />
              </span>
              {m.label && <span className="logo-name">{m.label}</span>}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
