import { asset } from '../lib/asset'
import './LogoStrip.css'

/* Education, employers, and the government client — real marks, quietly.
 * Marks that don't contain their own name get a mono label beside them. */
const MARKS: { src: string; alt: string; label?: string; href: string; wide?: boolean }[] = [
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
  { src: 'assets/logos/savills.png', alt: 'Savills', href: 'https://www.savills.com/' },
  { src: 'assets/logos/mhada.png', alt: 'MHADA — Government of Maharashtra', href: 'https://mhada.gov.in/en', wide: true },
]

export function LogoStrip() {
  return (
    <div className="logo-strip">
      <span className="logo-strip-caption">education · employers · client</span>
      <ul>
        {MARKS.map((m) => (
          <li key={m.alt}>
            <a href={m.href} target="_blank" rel="noreferrer" aria-label={m.alt}>
              <span className={`logo-chip ${m.wide ? 'is-wide' : ''}`}>
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
