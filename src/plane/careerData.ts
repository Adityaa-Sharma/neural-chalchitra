/* The career as a vector space.
 *
 * Coordinates are SEMANTIC, in units of roughly -4.5..4.5:
 *   x: research (−) ↔ production (+)
 *   y: models (+) ↔ infrastructure (−)
 * The origin is the B.S. in Mathematics — everything starts there.
 *
 * The career node sits at EXACTLY Σ wᵢ·pᵢ over the weighted components, so the
 * tip-to-tail animation is honest math, not decoration.
 *
 * VOICE RULES for every blurb (do not regress):
 *   plain and factual. constraint, decision, number. first person, plain verbs.
 *   no punchlines, no swagger. one admitted failure where true.
 *   banned: seamless, cutting-edge, leverage, passionate, pivotal, journey. */

export type NodeKind = 'origin' | 'education' | 'paper' | 'project' | 'work' | 'career' | 'learning'

export interface MediaItem {
  src: string // under public/, without base
  w: number
  h: number
  caption: string
}

export interface PlaneNode {
  id: string
  label: string
  sub?: string
  kind: NodeKind
  x: number
  y: number
  period: string
  blurb: string
  stack?: string[]
  links?: { label: string; url: string }[]
  media?: MediaItem[]
  /** ids this node is related to (drawn as constellation edges) */
  edges?: string[]
}

export const NODES: PlaneNode[] = [
  {
    id: 'origin',
    label: 'B.S. Mathematics',
    sub: 'the origin',
    kind: 'origin',
    x: 0,
    y: 0,
    period: 'Rajasthan University · 2020 — 2023',
    blurb:
      'Three years of real analysis, linear algebra and probability, before any ML. It is the base for most of what came later — the TenderGenie loss design, the GPU capacity planning, the retrieval structure in eve.',
    stack: ['real analysis', 'linear algebra', 'probability'],
  },
  {
    id: 'ms-iiitl',
    label: 'M.S. AI & ML',
    sub: 'IIIT Lucknow',
    kind: 'education',
    x: -1.4,
    y: 0.9,
    period: 'IIIT Lucknow · Dec 2023 — Jun 2025 · 9.23 CGPA',
    blurb:
      'Where the math turned into machine learning. I did the degree and industry work in parallel — by the time coursework reached attention, I had already implemented it from the paper.',
    stack: ['pytorch', 'nlp', 'deep learning'],
    edges: ['origin', 'gpt2', 'pgagi'],
  },
  {
    id: 'pgagi',
    label: 'PG-AGI',
    sub: 'first agent system · 2024',
    kind: 'work',
    x: 0.8,
    y: 1.1,
    period: 'AI/ML Intern · 2024',
    blurb:
      '2024, before agentic AI was a common term. I built a function-calling system to chat with a database in natural language — OpenAI function calling with DSPy — designed so a voice agent could run the whole retrieval engine at runtime.',
    stack: ['openai function calling', 'dspy', 'nl→sql'],
    links: [{ label: 'pgagi.in ↗', url: 'https://pgagi.in/' }],
    edges: ['ms-iiitl', 'ailake'],
  },
  {
    id: 'ailake',
    label: 'AI Lake',
    sub: 'chat with all your data',
    kind: 'project',
    x: 1.8,
    y: 0.9,
    period: 'Datasmith.ai · POC',
    blurb:
      'CSVs, Postgres and MongoDB integrated into one place; users chat with all of it at runtime. The agent picks the output format — table, bar chart, pie chart — rendered as React components on the fly, with a knowledge graph underneath.',
    stack: ['knowledge graph', 'dynamic react output', 'postgres · mongo'],
    edges: ['pgagi', 'mhada'],
  },
  {
    id: 'mhada',
    label: 'MHADA · Govt of Maharashtra',
    sub: 'production, end to end',
    kind: 'work',
    x: 3.4,
    y: -0.6,
    period: 'Datasmith.ai · founding member · live at mhada.gov.in',
    blurb:
      'Requirements: fully open source, answers from the website plus the lottery, NOC, tender and meeting-minute systems, in Marathi. I built the 8-tool agent — responses under 4 seconds on a 16k context window — and deployed everything myself: 4×A100 VMs with model parallelism and round-robin load balancing for 100+ concurrent users, Whisper, TTS, a vision model, Redis, Celery, Postgres, Superset dashboards, cron jobs, prod/UAT/dev separation. For a one-time job extracting keywords from about 10,000 leases, I sharded a larger-context model across the four VMs with Ray and ran it as a batch.',
    stack: ['8-tool agent · 16k ctx', '4×a100 · model parallelism', 'ray sharding', 'whisper · tts · vision', 'redis · celery · superset'],
    links: [{ label: 'live ↗', url: 'https://mhada.gov.in/en' }],
    edges: ['ailake', 'tendergenie', 'vllm-study', 'career'],
  },
  {
    id: 'tendergenie',
    label: 'TenderGenie',
    sub: 'Qwen3-14B fine-tune · SFT + GRPO',
    kind: 'work',
    x: -0.5,
    y: 2.7,
    period: 'Datasmith.ai · funded product · finished during my notice period',
    blurb:
      "Valve-industry datasheets have merged cells, rotated headers, several table schemas on one page — OpenAI's and Google's models were extracting them wrong. I set up automated dataset curation (Sarvam OCR, a frontier-model extraction pass, then human review) and fine-tuned Qwen3-14B with TRL. The first loss weighted every token equally, so the model did well on braces and colons and kept getting keys and values wrong — which is where the information is. A higher penalty on key and value tokens is what took it past the closed models, after SFT alone. GRPO improved it further. Runs logged in W&B.",
    stack: ['qwen3-14b', 'sft + grpo · trl', 'weighted token loss', 'sarvam ocr', 'wandb'],
    links: [{ label: 'tendergenie.ai ↗', url: 'https://www.tendergenie.ai/' }],
    edges: ['mhada', 'gpt2', 'career'],
  },
  {
    id: 'career',
    label: 'Senior AI Engineer',
    sub: 'Savills · the client hired me',
    kind: 'career',
    // EXACTLY Σ wᵢ·pᵢ over RESULTANT below — keep in sync
    x: 2.27,
    y: 1.34,
    period: 'Savills APAC · 2025 — present',
    blurb:
      "Savills was my client at Datasmith — I worked with their teams across 22 business lines in APAC: Singapore, Vietnam, Hong Kong, Australia, China. When I was leaving, they offered me the role directly. Since then: architected the APAC agent platform — agents, schedulers, outputs as live React components — demoed it to the APAC CIO, worked through GST/TDS reconciliation logic with the India CFO, built an RFI-response generator over the project-management team's SharePoint, and led hiring for the AI team.",
    stack: ['agent saas platform', 'ms entra s2s auth', 'apac · 22 business lines', 'team building'],
    links: [{ label: 'the full story → credits', url: '#credits' }],
    edges: ['mhada', 'tendergenie', 'eve'],
  },
  {
    id: 'eve',
    label: 'eve',
    sub: 'parent-child RAG · live',
    kind: 'project',
    x: 2.0,
    y: 1.5,
    period: 'freelance · live',
    blurb:
      'A university-search platform; the chatbot is the main feature. Some institutions have 400+ programs — too much for one chunk. I used parent-child RAG: parent is the institution, children are its programs, linked by university id so retrieval never mixes schools. Ingestion and the recommendation engine run on Airflow.',
    stack: ['parent-child rag', 'airflow', 'recommendation engine'],
    links: [{ label: 'live ↗', url: 'https://eve2-frontend-62944796586.us-central1.run.app/en-US/' }],
    edges: ['career', 'latimer'],
  },
  {
    id: 'latimer',
    label: 'latimer.ai',
    sub: 'freelance · live',
    kind: 'project',
    x: 2.6,
    y: 0.4,
    period: 'freelance · live',
    blurb:
      'Chat and full-stack features — auth, magic links — on a live product. I took requirements from the users directly, designed the solution and shipped it.',
    stack: ['chat', 'auth · magic link', 'fullstack'],
    links: [{ label: 'latimer.ai ↗', url: 'https://www.latimer.ai/' }],
    edges: ['eve'],
  },
  {
    id: 'gpt2',
    label: 'GPT-2 from scratch',
    sub: 'independent research',
    kind: 'paper',
    x: -3.0,
    y: 2.2,
    period: '2025 · after Vaswani et al., 2017',
    blurb:
      'My research side — nobody asked for this. Scraped 11,000 poems, wrote a character tokenizer, trained a 21.77M-parameter GPT-2 on a single 16 GB T4, from the paper rather than a framework. Knowing the layers at this level is also why the TenderGenie loss change was a small step, not a leap.',
    stack: ['pytorch', 'multi-head attention', 'char tokenizer'],
    links: [{ label: 'GPT-2-Scratch ↗', url: 'https://github.com/Adityaa-Sharma/GPT-2-Scratch' }],
    media: [
      {
        src: 'assets/gpt2/character_tokenized_model_loss.png',
        w: 3572,
        h: 1900,
        caption: 'the actual loss curve — five epochs, lr 6·10⁻⁴',
      },
    ],
    edges: ['ms-iiitl', 'linformer', 'tendergenie'],
  },
  {
    id: 'linformer',
    label: 'Linformer',
    sub: 'independent research',
    kind: 'paper',
    x: -3.6,
    y: 1.2,
    period: '2025 · after Wang et al., 2020',
    blurb:
      "Full attention pays a quadratic bill; Linformer claims a thin projection pays a linear one. I didn't take the paper's word for it — implemented it, trained it, and compared the curves myself.",
    stack: ['pytorch', 'low-rank projections', 'O(N) attention'],
    links: [
      {
        label: 'implementation ↗',
        url: 'https://github.com/Adityaa-Sharma/Linformer-paper-implemetation',
      },
    ],
    media: [
      {
        src: 'assets/linformer/loss_ratio.png',
        w: 1000,
        h: 500,
        caption: 'linformer vs full attention — the honest ratio',
      },
    ],
    edges: ['gpt2'],
  },
  {
    id: 'dqn',
    label: 'DQN · Breakout',
    sub: 'independent research',
    kind: 'paper',
    x: -2.2,
    y: 3.0,
    period: '2025 · after Mnih et al., 2013',
    blurb:
      'One convolutional network, pixels in, action values out. A million-transition replay buffer, a frozen target network, ε decaying 1.0 → 0.1 — after about 1,600 episodes the agent plays Breakout.',
    stack: ['pytorch', 'gym + ale', 'replay buffer'],
    links: [{ label: 'DeepQlearning ↗', url: 'https://github.com/Adityaa-Sharma/DeepQlearning' }],
    media: [
      {
        src: 'assets/dqn/DQN_Agent.gif',
        w: 160,
        h: 210,
        caption: 'my agent, after ~1,600 episodes',
      },
    ],
    edges: ['ms-iiitl'],
  },
  {
    id: 'refreader',
    label: 'RefReader',
    sub: 'first shipped system',
    kind: 'project',
    x: 2.2,
    y: 1.6,
    period: '2024-25 · deployed',
    blurb:
      'An AI research assistant over an ArXiv vector store: two-stage RAG — metadata filtering, then semantic search — Qdrant and Postgres underneath. The first thing I built that stopped being a repo and became a running system.',
    stack: ['fastapi', 'qdrant', 'two-stage rag'],
    links: [
      { label: 'backend ↗', url: 'https://github.com/Adityaa-Sharma/Ref_Reader_backend' },
      { label: 'frontend ↗', url: 'https://github.com/Adityaa-Sharma/ref-reader-frontend' },
    ],
    edges: ['ailake'],
  },
  {
    id: 'tradingmcp',
    label: 'Trading MCP',
    sub: 'personal project',
    kind: 'project',
    x: 1.5,
    y: 0.6,
    period: '2025',
    blurb:
      'An MCP server that gives a language model real hands: live Upstox portfolio access, order execution, AlphaVantage analytics — natural-language trading from inside an editor.',
    stack: ['mcp', 'upstox api'],
    links: [{ label: 'repo ↗', url: 'https://github.com/Adityaa-Sharma/Trading_mcp_server' }],
    edges: ['refreader'],
  },
  {
    id: 'cuda',
    label: 'CUDA kernels',
    sub: 'below the framework',
    kind: 'learning',
    x: -2.6,
    y: -1.9,
    period: 'now',
    blurb:
      'Hand-written CUDA — matrix multiplication and counting. Presented honestly: study, not yet contribution.',
    stack: ['cuda c++'],
    links: [{ label: 'cudaKernels ↗', url: 'https://github.com/Adityaa-Sharma/cudaKernels' }],
    edges: ['vllm-study'],
  },
  {
    id: 'vllm-study',
    label: 'vLLM internals',
    sub: 'reading the engine I deploy',
    kind: 'learning',
    x: -1.2,
    y: -2.5,
    period: 'now',
    blurb:
      'I ran vLLM in production on 4×A100s — now I read the engine itself: paged KV-cache, continuous batching, the scheduler. Study today, contribution intended.',
    stack: ['vllm', 'paged attention', 'ray'],
    edges: ['cuda', 'mhada'],
  },
]

/** The honest linear combination: career = Σ wᵢ·pᵢ (verified: (2.27, 1.34)). */
export const RESULTANT: { id: string; w: number }[] = [
  { id: 'mhada', w: 0.6 },
  { id: 'tendergenie', w: 0.5 },
  { id: 'ailake', w: 0.2 },
  { id: 'pgagi', w: 0.15 },
]

export const nodeById = (id: string) => NODES.find((n) => n.id === id)

/** de-duplicated edge list (a-b once) */
export const EDGES: [string, string][] = (() => {
  const seen = new Set<string>()
  const out: [string, string][] = []
  for (const n of NODES) {
    for (const e of n.edges ?? []) {
      const key = [n.id, e].sort().join('~')
      if (!seen.has(key) && nodeById(e)) {
        seen.add(key)
        out.push([n.id, e])
      }
    }
  }
  return out
})()
