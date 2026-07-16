import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface EqProps {
  tex: string
  display?: boolean
  className?: string
}

/** Renders a LaTeX string with KaTeX. `trust` is on so scenes can tag
 *  sub-terms with \htmlClass and animate them. */
export function Eq({ tex, display = false, className }: EqProps) {
  const html = useMemo(
    () =>
      katex.renderToString(tex, {
        displayMode: display,
        throwOnError: false,
        trust: true,
        strict: false,
      }),
    [tex, display],
  )

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
