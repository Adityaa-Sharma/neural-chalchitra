import { useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { asset } from '../lib/asset'
import './PhotoStill.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/** The person appears at the credits — cinema convention. Duotone film still
 *  with a clip reveal; renders nothing until public/me.jpg exists. */
export function PhotoStill() {
  const ref = useRef<HTMLElement>(null)
  const [missing, setMissing] = useState(false)
  const reducedMotion = usePrefersReducedMotion()

  useGSAP(
    () => {
      if (reducedMotion || missing || !ref.current) return
      gsap.fromTo(
        '.photo-still-frame',
        { clipPath: 'inset(100% 0 0 0)' },
        {
          clipPath: 'inset(0% 0 0 0)',
          duration: 1.0,
          ease: 'expo.inOut',
          scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true },
        },
      )
    },
    { scope: ref, dependencies: [reducedMotion, missing] },
  )

  if (missing) return null

  return (
    <figure className="photo-still" ref={ref}>
      <div className="photo-still-frame">
        <img
          src={asset('assets/me.jpeg')}
          alt="Aditya Sharma"
          width={640}
          height={800}
          loading="lazy"
          onError={() => setMissing(true)}
        />
      </div>
      <figcaption>
        aditya sharma · pune, india
        <br />
        <span>starring in all four scenes</span>
      </figcaption>
    </figure>
  )
}
