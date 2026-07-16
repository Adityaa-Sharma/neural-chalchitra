import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import './KVCachePager.css'

/* 8×4 grid of physical KV-cache blocks. Each frame maps blockIndex → owner.
   Sequences allocate non-contiguous pages, finish, and their pages are reused —
   virtual memory, but for attention. */
type Owner = 'a' | 'b' | 'c' | null

const BLOCKS = 32

const FRAMES: { title: string; alloc: Record<number, Owner> }[] = [
  {
    title: 'request A arrives — pages mapped wherever they fit',
    alloc: { 0: 'a', 1: 'a', 2: 'a' },
  },
  {
    title: 'request B arrives mid-generation — no contiguity needed',
    alloc: { 0: 'a', 1: 'a', 2: 'a', 5: 'b', 6: 'b', 12: 'b' },
  },
  {
    title: 'both grow — continuous batching keeps the GPU full',
    alloc: { 0: 'a', 1: 'a', 2: 'a', 3: 'a', 9: 'a', 5: 'b', 6: 'b', 12: 'b', 13: 'b', 20: 'b' },
  },
  {
    title: 'A finishes — its pages are freed instantly',
    alloc: { 5: 'b', 6: 'b', 12: 'b', 13: 'b', 20: 'b' },
  },
  {
    title: "request C reuses A's pages — zero fragmentation wasted",
    alloc: { 5: 'b', 6: 'b', 12: 'b', 13: 'b', 20: 'b', 0: 'c', 1: 'c', 3: 'c', 9: 'c', 21: 'c' },
  },
]

const STEP_MS = 2200

export function KVCachePager() {
  const rootRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const [frame, setFrame] = useState(reducedMotion ? FRAMES.length - 1 : 0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      threshold: 0.3,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (reducedMotion || !visible) return
    const id = window.setInterval(
      () => setFrame((f) => (f + 1) % FRAMES.length),
      STEP_MS,
    )
    return () => window.clearInterval(id)
  }, [reducedMotion, visible])

  const { title, alloc } = FRAMES[frame]

  return (
    <figure className="kv-pager" ref={rootRef}>
      <div className="kv-header">
        <span className="kv-title">PagedAttention — KV cache as virtual memory</span>
        <span className="kv-frame-title">{title}</span>
      </div>
      <div className="kv-grid" role="img" aria-label="GPU memory blocks being allocated to requests as pages">
        {Array.from({ length: BLOCKS }, (_, i) => (
          <div key={i} className={`kv-block ${alloc[i] ? `kv-${alloc[i]}` : ''}`} />
        ))}
      </div>
      <div className="kv-legend">
        <span><i className="kv-chip kv-a" /> request A</span>
        <span><i className="kv-chip kv-b" /> request B</span>
        <span><i className="kv-chip kv-c" /> request C</span>
        <span><i className="kv-chip" /> free block</span>
      </div>
      <figcaption>
        Attention needs every past token&rsquo;s K and V. Naive serving reserves one giant
        contiguous slab per user and wastes most of it. vLLM pages the cache like an OS pages
        RAM — this is the difference between <strong>20 users and 100+</strong> on the same four
        A100s.
      </figcaption>
    </figure>
  )
}
