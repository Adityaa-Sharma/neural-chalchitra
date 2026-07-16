import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import './TypedTerminal.css'

interface TermLine {
  type: 'cmd' | 'out' | 'gap'
  text: string
  accent?: boolean
}

/* The infra story, told the way it actually happened: in a shell. */
const SCRIPT: TermLine[] = [
  { type: 'cmd', text: 'nvidia-smi --query-gpu=name,memory.total --format=csv,noheader' },
  { type: 'out', text: 'NVIDIA A100 80GB PCIe, 81920 MiB' },
  { type: 'out', text: 'NVIDIA A100 80GB PCIe, 81920 MiB' },
  { type: 'out', text: 'NVIDIA A100 80GB PCIe, 81920 MiB' },
  { type: 'out', text: 'NVIDIA A100 80GB PCIe, 81920 MiB' },
  { type: 'gap', text: '' },
  { type: 'cmd', text: 'vllm serve Qwen/Qwen3-14B-AWQ --max-num-seqs 128' },
  { type: 'out', text: 'INFO  engine: KV cache paged · continuous batching enabled' },
  { type: 'out', text: 'INFO  serving 100+ concurrent users · TTFT within budget', accent: true },
  { type: 'gap', text: '' },
  { type: 'cmd', text: 'docker compose ps --services --filter status=running' },
  { type: 'out', text: 'whisper-large-v3   qwen2-vl-7b   indic-parler-tts' },
  { type: 'out', text: 'redis   celery   qdrant   postgres   nginx' },
  { type: 'gap', text: '' },
  { type: 'cmd', text: 'kind create cluster && helm install inframind ./chart' },
  { type: 'out', text: 'inframind: dependency graph built · causal RCA agents ready' },
  { type: 'gap', text: '' },
  { type: 'cmd', text: 'systemctl status daimon' },
  { type: 'out', text: '● daimon.service — δαίμων, a guiding spirit', accent: true },
  { type: 'out', text: '   Loaded: from mythology; adapted by Unix, 1963', accent: true },
  { type: 'out', text: '   Active: running — serving quietly in the background', accent: true },
]

const CMD_CHAR_MS = 26
const OUT_LINE_MS = 110

export function TypedTerminal() {
  const rootRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const [progress, setProgress] = useState(reducedMotion ? Number.MAX_SAFE_INTEGER : 0)
  const [started, setStarted] = useState(false)

  // if the user enables reduce-motion mid-session, fast-forward to the end
  useEffect(() => {
    if (reducedMotion) setProgress(Number.MAX_SAFE_INTEGER)
  }, [reducedMotion])

  // begin typing when the terminal scrolls into view
  useEffect(() => {
    if (reducedMotion) return
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStarted(true)
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reducedMotion])

  // one global character clock; each line owns a span of ticks
  useEffect(() => {
    if (!started || reducedMotion) return
    const id = window.setInterval(() => {
      setProgress((p) => {
        if (p >= totalTicks) window.clearInterval(id)
        return p + 1
      })
    }, CMD_CHAR_MS)
    return () => window.clearInterval(id)
  }, [started, reducedMotion])

  // precompute each line's tick budget
  let tick = 0
  const spans = SCRIPT.map((line) => {
    const cost =
      line.type === 'cmd' ? line.text.length : Math.ceil(OUT_LINE_MS / CMD_CHAR_MS)
    const span = { start: tick, cost }
    tick += cost
    return span
  })
  const totalTicks = tick
  const done = progress >= totalTicks

  return (
    <div className="typed-terminal" ref={rootRef}>
      <div className="term-titlebar">
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-title">aditya@machine-room: ~</span>
        {!done && !reducedMotion && (
          <button className="term-skip" onClick={() => setProgress(totalTicks)}>
            skip ⇥
          </button>
        )}
      </div>
      <div className="term-body">
        {SCRIPT.map((line, i) => {
          const { start, cost } = spans[i]
          if (progress < start) return null
          if (line.type === 'gap') return <div className="term-gap" key={i} />
          if (line.type === 'cmd') {
            const chars = Math.min(line.text.length, progress - start)
            const typing = chars < line.text.length
            return (
              <div className="term-line term-cmd" key={i}>
                <span className="term-prompt">$ </span>
                {line.text.slice(0, chars)}
                {typing && <span className="term-caret" />}
              </div>
            )
          }
          if (progress < start + cost) return null
          return (
            <div className={`term-line term-out ${line.accent ? 'is-accent' : ''}`} key={i}>
              {line.text}
            </div>
          )
        })}
        {done && (
          <div className="term-line term-cmd">
            <span className="term-prompt">$ </span>
            <span className="term-caret" />
          </div>
        )}
      </div>
    </div>
  )
}
