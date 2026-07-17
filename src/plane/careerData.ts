/* The career as a vector space.
 *
 * Coordinates are SEMANTIC, in units of roughly -4.5..4.5:
 *   x: research (−) ↔ production (+)
 *   y: models (+) ↔ infrastructure (−)
 * The origin is the B.S. in Mathematics — everything starts there.
 *
 * The career node sits at EXACTLY Σ wᵢ·pᵢ over the weighted components, so the
 * tip-to-tail animation is honest math, not decoration. */

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
      'Three years of real analysis, linear algebra and probability — before a single line of ML code. This plane has an origin, and this is it: every vector on the map is measured from here.',
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
      'Where mathematics turned into machine learning. Coursework became implementation: this is the node where the papers below started getting read — and then rebuilt.',
    stack: ['pytorch', 'nlp', 'deep learning'],
    edges: ['origin', 'gpt2', 'dqn'],
  },
  {
    id: 'gpt2',
    label: 'GPT-2 from scratch',
    sub: 'the poet',
    kind: 'paper',
    x: -3.0,
    y: 2.2,
    period: 'early 2025 · after Vaswani et al., 2017',
    blurb:
      'Scraped 11,000 poems, wrote a character tokenizer (vocab 202), and trained a 21.77M-parameter GPT-2 on a single 16 GB T4 — from nothing but the paper. 12 layers, 12 heads, 768 dims of hard-won intuition.',
    stack: ['pytorch', 'cuda', 'multi-head attention', 'char tokenizer'],
    links: [{ label: 'GPT-2-Scratch ↗', url: 'https://github.com/Adityaa-Sharma/GPT-2-Scratch' }],
    media: [
      {
        src: 'assets/gpt2/character_tokenized_model_loss.png',
        w: 3572,
        h: 1900,
        caption: 'the actual loss curve — five epochs, lr 6·10⁻⁴',
      },
    ],
    edges: ['ms-iiitl', 'linformer', 'refreader'],
  },
  {
    id: 'linformer',
    label: 'Linformer',
    sub: 'attention, linearized',
    kind: 'paper',
    x: -3.6,
    y: 1.2,
    period: '2025 · after Wang et al., 2020',
    blurb:
      "Full attention greets every token with every token — a quadratic bill. Linformer claims a thin projection pays a linear one. I didn't take the paper's word for it: implemented, trained, and compared the curves myself.",
    stack: ['pytorch', 'low-rank projections', 'O(N) attention'],
    links: [
      {
        label: 'Linformer implementation ↗',
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
    sub: 'the agent',
    kind: 'paper',
    x: -2.2,
    y: 3.0,
    period: '2025 · after Mnih et al., 2013',
    blurb:
      'One convolutional network, pixels in, action values out. A million-transition replay buffer, a frozen target network, ε decaying from 1.0 to 0.1 — and after ~1,600 episodes, my agent plays Breakout.',
    stack: ['pytorch', 'gym + ale', 'replay buffer', 'ε-greedy'],
    links: [{ label: 'DeepQlearning ↗', url: 'https://github.com/Adityaa-Sharma/DeepQlearning' }],
    media: [
      {
        src: 'assets/dqn/DQN_Agent.gif',
        w: 160,
        h: 210,
        caption: 'not a stock gif — my agent, after ~1,600 episodes',
      },
    ],
    edges: ['ms-iiitl'],
  },
  {
    id: 'mistral',
    label: 'Mistral fine-tune',
    sub: 'first applied LLM work',
    kind: 'project',
    x: -1.0,
    y: 1.9,
    period: 'Apr 2024',
    blurb:
      'Where the applied journey started: fine-tuning Mistral for mental-health counseling dialogue. The earliest node in the LLM cluster — everything to its right got more production-grade from here.',
    stack: ['lora/qlora', 'peft', 'transformers'],
    links: [
      {
        label: 'repo ↗',
        url: 'https://github.com/Adityaa-Sharma/Mistral-finetuning-mental_health',
      },
    ],
    edges: ['gpt2', 'refreader'],
  },
  {
    id: 'refreader',
    label: 'RefReader',
    sub: 'shipped & running',
    kind: 'project',
    x: 2.2,
    y: 1.6,
    period: '2024-25 · deployed',
    blurb:
      'An AI research assistant over an ArXiv vector store: two-stage RAG — metadata filtering, then semantic search — with Qdrant and Postgres underneath. The first project that stopped being a repo and became a running system.',
    stack: ['fastapi', 'qdrant', 'postgres', 'docker'],
    links: [
      { label: 'backend ↗', url: 'https://github.com/Adityaa-Sharma/Ref_Reader_backend' },
      { label: 'frontend ↗', url: 'https://github.com/Adityaa-Sharma/ref-reader-frontend' },
    ],
    edges: ['gpt2', 'mistral', 'career'],
  },
  {
    id: 'tradingmcp',
    label: 'Trading MCP',
    sub: 'LLMs with real hands',
    kind: 'project',
    x: 1.5,
    y: 0.6,
    period: '2025',
    blurb:
      'An MCP server that gives language models real hands: live Upstox portfolio access, order execution, AlphaVantage analytics — natural-language trading from inside an editor.',
    stack: ['mcp', 'pydantic', 'upstox api'],
    links: [
      { label: 'repo ↗', url: 'https://github.com/Adityaa-Sharma/Trading_mcp_server' },
    ],
    edges: ['refreader'],
  },
  {
    id: 'inframind',
    label: 'InfraMind',
    sub: 'K8s AIOps copilot',
    kind: 'project',
    x: 2.6,
    y: -1.8,
    period: '2025-26',
    blurb:
      'A Kubernetes-native AIOps copilot: builds a live service-dependency graph, scores holistic health, and runs causal root-cause analysis with AI agents — observe, approve, or auto-remediate.',
    stack: ['kubernetes', 'helm', 'prometheus', 'loki', 'multi-agent'],
    links: [{ label: 'InfraMind ↗', url: 'https://github.com/Adityaa-Sharma/InfraMind' }],
    edges: ['career', 'vllm-study'],
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
      'Hand-written CUDA — matrix multiplication and counting. Presented honestly: study, not yet contribution. The plane has a whole quadrant I am still filling in.',
    stack: ['cuda c++', 'makefiles'],
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
      'I deploy vLLM in production — now I am reading the engine itself: paged KV-cache, continuous batching, the scheduler. Study today, contribution intended.',
    stack: ['vllm', 'paged attention', 'ray (next)'],
    edges: ['cuda', 'mhada'],
  },
  {
    id: 'pgagi',
    label: 'PG-AGI',
    sub: 'first industry rep',
    kind: 'work',
    x: 0.8,
    y: 1.1,
    period: 'AI/ML Intern · May — Jun 2024',
    blurb:
      'Natural-language multi-database querying PoC and custom GPT builds — the first taste of building for someone other than myself.',
    stack: ['nl2sql', 'openai api'],
    edges: ['career'],
  },
  {
    id: 'mhada',
    label: 'MHADA-Sathi',
    sub: 'govt-scale production',
    kind: 'work',
    x: 3.4,
    y: -0.6,
    period: 'Datasmith.ai · 2024-25 · live at mhada.gov.in',
    blurb:
      'The Government of Maharashtra&rsquo;s multilingual chatbot, end to end: an 8-tool agent with hybrid RAG; GPU capacity planning I defended myself — KV-cache, TTFT, TPS — for 4×A100 80GB; vLLM serving chat, vision, STT and TTS for 100+ concurrent users, in Marathi.',
    stack: ['vllm', 'qwen3-14b-awq', 'whisper', 'redis · celery · qdrant', 'nginx'],
    links: [{ label: 'live ↗', url: 'https://mhada.gov.in/en' }],
    edges: ['career', 'vllm-study'],
  },
  {
    id: 'career',
    label: 'Associate AI Engineer',
    sub: 'Datasmith.ai — the resultant',
    kind: 'career',
    // EXACTLY Σ wᵢ·pᵢ over RESULTANT below — keep in sync
    x: 3.13,
    y: 0.79,
    period: 'Oct 2024 — present · Pune',
    blurb:
      'The current position — not a jump, a sum. Weight the poet model, the shipped RAG system, the govt-scale deployment and the infra copilot, add them tip to tail, and the arrow lands here. Next term in the series: Ray, and wider machines.',
    stack: ['agentic llm systems', 'vllm serving', 'gpu capacity planning', 'rag'],
    links: [{ label: 'the full story → credits', url: '#credits' }],
    edges: ['refreader', 'inframind', 'mhada', 'pgagi'],
  },
]

/** The honest linear combination: career = Σ wᵢ·pᵢ (verified: (3.13, 0.79)). */
export const RESULTANT: { id: string; w: number }[] = [
  { id: 'gpt2', w: 0.25 },
  { id: 'refreader', w: 0.6 },
  { id: 'mhada', w: 0.6 },
  { id: 'inframind', w: 0.2 },
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
