import { useRef, type ElementType, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

gsap.registerPlugin(ScrollTrigger, useGSAP)

interface RevealProps {
  as?: ElementType
  className?: string
  delay?: number
  children: ReactNode
}

/** The site's one entrance: blur + fade + small rise, fired once on scroll-in.
 *  8-24px travel and a single easing keep the motion felt rather than seen. */
export function Reveal({ as: Tag = 'div', className, delay = 0, children }: RevealProps) {
  const ref = useRef<HTMLElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useGSAP(
    () => {
      if (reducedMotion || !ref.current) return
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 18, filter: 'blur(6px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.85,
          delay,
          ease: 'power3.out',
          scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
        },
      )
    },
    { scope: ref, dependencies: [reducedMotion] },
  )

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  )
}
