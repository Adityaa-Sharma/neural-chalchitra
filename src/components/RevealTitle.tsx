import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

gsap.registerPlugin(ScrollTrigger, SplitText)

interface RevealTitleProps {
  className?: string
  children: ReactNode
}

/** Masked line reveal for scene titles: each line rises out of an invisible
 *  clip. Splits only after fonts settle so line breaks are final. */
export function RevealTitle({ className, children }: RevealTitleProps) {
  const ref = useRef<HTMLHeadingElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (reducedMotion || !ref.current) return
    const el = ref.current
    let split: SplitText | null = null
    let tween: gsap.core.Tween | null = null
    let cancelled = false

    document.fonts.ready.then(() => {
      if (cancelled) return
      split = SplitText.create(el, { type: 'lines', mask: 'lines' })
      tween = gsap.from(split.lines, {
        yPercent: 105,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.07,
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      })
    })

    return () => {
      cancelled = true
      tween?.scrollTrigger?.kill()
      tween?.kill()
      split?.revert()
    }
  }, [reducedMotion])

  return (
    <h2 ref={ref} className={className}>
      {children}
    </h2>
  )
}
