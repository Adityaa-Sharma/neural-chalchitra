import type { ReactNode } from 'react'
import { Reveal } from '../components/Reveal'
import { RevealTitle } from '../components/RevealTitle'
import { LiveClock } from '../components/LiveClock'
import { PhotoStill } from '../components/PhotoStill'
import { useMagnetic } from '../hooks/useMagnetic'
import { asset } from '../lib/asset'
import './Credits.css'

const ROLL: [string, string][] = [
  ['written, trained & deployed by', 'Aditya Sharma'],
  ['mathematics', 'B.S. Honors, Rajasthan University'],
  ['graduate studies', 'M.S. AI & ML, IIIT Lucknow · 9.23 CGPA'],
  ['currently', 'Associate AI Engineer, Datasmith.ai'],
  ['papers re-implemented', 'Vaswani 2017 · Wang 2020 · Mnih 2013'],
  ['compute', '4×A100 80GB (production) · 1×T4 16GB (poetry)'],
  ['languages', 'Python · C++ · Marathi-serving · JS (learning, this site)'],
  ['special thanks', 'the gradient, for always pointing somewhere'],
]

const NOW = [
  'Ray & tensor parallelism — going wider than one box',
  'vLLM internals — reading the engine I deploy',
  'CUDA kernels — going below the framework',
  'v2 of this site — my DQN playing Breakout live in your browser (ONNX + ALE-WASM)',
]

function MagneticLink({ href, children }: { href: string; children: ReactNode }) {
  const ref = useMagnetic<HTMLAnchorElement>()
  const external = href.startsWith('http') || href.endsWith('.pdf')
  return (
    <a ref={ref} href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
      {children}
    </a>
  )
}

export function Credits() {
  return (
    <section className="scene credits" id="credits">
      <div className="scene-inner">
        <Reveal className="slate">
          <strong>End Credits</strong> समाप्त
        </Reveal>

        <RevealTitle className="scene-title">Every film ends with names.</RevealTitle>

        <div className="credits-lead">
          <Reveal>
            <PhotoStill />
          </Reveal>
          <Reveal as="p" className="prose" delay={0.1}>
            The plane, the attention, the agent, the machine room — one person carried the camera
            through all of it. I like problems where the math has to survive contact with
            production. If you have one of those, the contacts are below.
          </Reveal>
        </div>

        <div className="credits-work">
          <Reveal className="credits-block">
            <h3>Experience</h3>
            <div className="credit-entry">
              <div className="credit-head">
                <strong>Datasmith.ai</strong>
                <span>Associate AI Engineer · Oct 2024 — present</span>
              </div>
              <p>
                MHADA-Sathi (Govt. of Maharashtra) end-to-end: 8-tool agent, hybrid RAG, GPU
                capacity planning, vLLM serving for 100+ concurrent users. Enterprise automation
                for Savills Asia. Knowledge-graph virtual data-lake PoC across Mongo, Postgres,
                Neo4j.
              </p>
            </div>
            <div className="credit-entry">
              <div className="credit-head">
                <strong>PG-AGI</strong>
                <span>AI/ML Intern · 2024</span>
              </div>
              <p>Natural-language multi-database querying PoC; custom GPT builds.</p>
            </div>
          </Reveal>

          <Reveal className="credits-block" delay={0.08}>
            <h3>Also featuring</h3>
            <a
              className="credit-card glow-card"
              href="https://github.com/Adityaa-Sharma/Ref_Reader_backend"
              target="_blank"
              rel="noreferrer"
            >
              <strong>RefReader</strong>
              <p>
                AI research assistant over an ArXiv vector store — two-stage RAG, semantic search
                with Qdrant + Postgres, deployed and running.
              </p>
              <span>python · fastapi · qdrant · docker</span>
            </a>
            <a
              className="credit-card glow-card"
              href="https://github.com/Adityaa-Sharma/Trading_mcp_server"
              target="_blank"
              rel="noreferrer"
            >
              <strong>Trading MCP Server</strong>
              <p>
                MCP server giving LLMs real hands: live Upstox portfolio access, order execution,
                AlphaVantage analytics — natural-language trading from an editor.
              </p>
              <span>mcp · pydantic · upstox api</span>
            </a>
          </Reveal>

          <Reveal className="credits-block" delay={0.16}>
            <h3>Currently noodling on</h3>
            <ul className="now-list">
              {NOW.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal className="credits-roll" aria-label="credits">
          {ROLL.map(([role, name]) => (
            <div className="roll-line" key={role}>
              <span className="roll-role">{role}</span>
              <span className="roll-name">{name}</span>
            </div>
          ))}
        </Reveal>

        <Reveal className="credits-contact">
          <MagneticLink href="mailto:mailmeifyoucan7@gmail.com">email</MagneticLink>
          <MagneticLink href="https://github.com/Adityaa-Sharma">github</MagneticLink>
          <MagneticLink href="https://huggingface.co/Adityyaa">hugging face</MagneticLink>
          <MagneticLink href={asset('Aditya_Sharma_Resume.pdf')}>resume.pdf</MagneticLink>
        </Reveal>

        <Reveal as="p" className="credits-end">
          फिर मिलेंगे — <em>see you in the sequel.</em>
          <br />
          <span>
            © 2026 Aditya Sharma · hand-built with React, GSAP &amp; KaTeX · no portfolio
            templates were harmed
          </span>
          <br />
          <LiveClock />
        </Reveal>
      </div>
    </section>
  )
}
