import type { ReactNode } from 'react'
import { Reveal } from '../components/Reveal'
import { RevealTitle } from '../components/RevealTitle'
import { LiveClock } from '../components/LiveClock'
import { PhotoStill } from '../components/PhotoStill'
import { useMagnetic } from '../hooks/useMagnetic'
import { asset } from '../lib/asset'
import './Credits.css'

const ROLL: [string, string][] = [
  ['built, trained & deployed by', 'Aditya Sharma'],
  ['mathematics', 'B.S. Honors, Rajasthan University'],
  ['graduate studies', 'M.S. AI & ML, IIIT Lucknow · 9.23 CGPA'],
  ['currently', 'Senior AI Engineer, Savills'],
  ['previously', 'Founding member, Datasmith.ai · AI/ML Intern, PG-AGI'],
  ['papers re-implemented', 'Vaswani 2017 · Wang 2020 · Mnih 2013'],
  ['compute', '4×A100 80GB (production) · 1×T4 16GB (poetry)'],
  ['languages', 'Python · C++ · Marathi-serving · JS (learning, this site)'],
  ['special thanks', 'the gradient, for always pointing somewhere'],
]

/* Opinions from debugging, not a topic list. */
const NOW = [
  'Context bloat — most "hallucinations" I have debugged were context problems. MHADA runs on 16k on purpose.',
  'Ray & tensor parallelism — one box is never the final answer',
  'vLLM internals — reading the engine I deploy',
  'CUDA kernels — going below the framework',
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
          <strong>Credits</strong> समाप्त
        </Reveal>

        <RevealTitle className="scene-title">The person behind the work.</RevealTitle>

        <div className="credits-lead">
          <Reveal>
            <PhotoStill />
          </Reveal>
          <Reveal as="p" className="prose" delay={0.1}>
            Math degree, then models, then the machines they run on — I built everything on this
            page myself. I like problems where the math has to survive contact with production. If
            you have one of those, the contacts are below.
          </Reveal>
        </div>

        <div className="credits-work">
          <Reveal className="credits-block">
            <h3>Experience</h3>
            <div className="credit-entry">
              <div className="credit-head">
                <strong>Savills</strong>
                <span>Senior AI Engineer · 2025 — present</span>
              </div>
              <p>
                Savills was my client at Datasmith; when I was leaving, they offered me the role.
                Architected the APAC agent platform — agents, schedulers, outputs as live React
                components — and demoed it to the APAC CIO. Worked GST/TDS reconciliation logic
                through with the India CFO, built an RFI-response generator over the PM team&rsquo;s
                SharePoint, and led hiring for the AI team.
              </p>
            </div>
            <div className="credit-entry">
              <div className="credit-head">
                <strong>Datasmith.ai</strong>
                <span>Founding member · 2024 — 2025</span>
              </div>
              <p>
                Owned client work from POC to production. MHADA (Govt. of Maharashtra): 8-tool
                agent under 4 seconds on a 16k window, 4×A100 serving for 100+ concurrent users,
                the whole deployment estate. TenderGenie: fine-tuned Qwen3-VL-8B (LoRA SFT → GRPO
                with rule-based rewards — per-field accuracy, JSON validity, a hallucination
                penalty) past the closed models on valve-industry datasheets. AI Lake: chat with
                all your data, agent-chosen React outputs. Also interviewed and hired the AI team.
              </p>
            </div>
            <div className="credit-entry">
              <div className="credit-head">
                <strong>PG-AGI</strong>
                <span>AI/ML Intern · 2024</span>
              </div>
              <p>
                A function-calling system to chat with databases in natural language — OpenAI
                function calling with DSPy, built to sit under voice agents. 2024, before agents
                were a pitch-deck word.
              </p>
            </div>
            <div className="credit-entry">
              <div className="credit-head">
                <strong>Freelance</strong>
                <span>live products</span>
              </div>
              <p>
                <a href="https://eve2-frontend-62944796586.us-central1.run.app/en-US/" target="_blank" rel="noreferrer">
                  eve
                </a>{' '}
                — university-search chatbot on parent-child RAG (some schools have 400+ programs;
                one chunk cannot hold them), Airflow ingestion.{' '}
                <a href="https://www.latimer.ai/" target="_blank" rel="noreferrer">
                  latimer.ai
                </a>{' '}
                — chat, auth, magic links, requirements taken directly from users.
              </p>
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
            <h3>Problems I&rsquo;m chasing</h3>
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
          <MagneticLink href="mailto:adityasharma.jprr@gmail.com">email</MagneticLink>
          <MagneticLink href="https://github.com/Adityaa-Sharma">github</MagneticLink>
          <MagneticLink href="https://huggingface.co/Adityyaa">hugging face</MagneticLink>
          <MagneticLink href={asset('Aditya_Sharma_Resume.pdf')}>resume.pdf</MagneticLink>
        </Reveal>

        <Reveal as="p" className="credits-end">
          फिर मिलेंगे — <em>see you around.</em>
          <br />
          <span>
            © 2026 Aditya Sharma · hand-built with React, GSAP &amp; three.js · no portfolio
            templates were harmed
          </span>
          <br />
          <LiveClock />
        </Reveal>
      </div>
    </section>
  )
}
