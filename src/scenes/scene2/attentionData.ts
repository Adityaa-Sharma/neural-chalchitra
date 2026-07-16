/* Illustrative attention patterns at character level — the same granularity
   my GPT-2 reads (vocab 202, character tokenizer). Two classic, well-documented
   head personalities. Real tensor export from GPT-2-Scratch is on the roadmap. */

export const TOKENS = ['t', 'h', 'e', '␣', 'm', 'o', 'o', 'n'] as const

export interface Head {
  name: string
  description: string
  /** weights[i][j] = how much token i attends to token j (rows sum to 1, causal). */
  weights: number[][]
}

/** Causal previous-token head: each character leans hard on its neighbor. */
function previousTokenHead(n: number): number[][] {
  const w: number[][] = []
  for (let i = 0; i < n; i++) {
    const row = new Array<number>(n).fill(0)
    if (i === 0) {
      row[0] = 1
    } else {
      row[i - 1] = 0.72
      row[i] = 0.18
      for (let j = 0; j < i - 1; j++) row[j] = 0.1 / (i - 1)
    }
    w.push(row)
  }
  return w
}

/** Attention-sink head: everything drains to the first token, with a self echo. */
function sinkHead(n: number): number[][] {
  const w: number[][] = []
  for (let i = 0; i < n; i++) {
    const row = new Array<number>(n).fill(0)
    if (i === 0) {
      row[0] = 1
    } else {
      row[0] = 0.62
      row[i] = 0.26
      for (let j = 1; j < i; j++) row[j] = 0.12 / (i - 1)
    }
    w.push(row)
  }
  return w
}

export const HEADS: Head[] = [
  {
    name: 'previous-token head',
    description:
      'A head that binds each character to the one before it — how a character-level model stitches "m-o-o-n" into a word.',
    weights: previousTokenHead(TOKENS.length),
  },
  {
    name: 'sink head',
    description:
      'A head that parks most of its budget on the first token — the "attention sink" pattern that later matters for KV-cache eviction in serving.',
    weights: sinkHead(TOKENS.length),
  },
]
