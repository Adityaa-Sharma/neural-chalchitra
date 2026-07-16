/** URL of the deployed Cloudflare Worker from voice-proxy/ (empty = voice off,
 *  the daimon still navigates via typed keywords). Example:
 *  'https://neural-chalchitra-voice.your-account.workers.dev' */
export const VOICE_PROXY_URL = 'https://neural-chalchitra-voice.mailmeifyoucan7.workers.dev'

/** Section ids the guide can navigate to (must match scene ids in App). */
export const SECTIONS: Record<string, string> = {
  title: 'title',
  mathematics: 'mathematics',
  attention: 'attention',
  agent: 'agent',
  'machine-room': 'machine-room',
  credits: 'credits',
}

/** Client-side fallback intent matcher — keeps navigation working with no
 *  backend, no credits, no network. */
export function matchLocalIntent(text: string): { speech: string; action: string } | null {
  const t = text.toLowerCase()
  const go = (id: string, speech: string) => ({ speech, action: `scroll:${id}` })

  if (/(math|गणित|vector|eigen|plane|degree)/.test(t))
    return go('mathematics', 'Scene one — where it all started, with a mathematics degree.')
  if (/(attention|transformer|gpt|poem|linformer|ध्यान)/.test(t))
    return go('attention', 'Scene two — the transformer he built from scratch.')
  if (/(agent|rl|reinforcement|breakout|atari|dqn|game)/.test(t))
    return go('agent', 'Scene three — his DQN agent playing Breakout.')
  if (/(infra|vllm|gpu|a100|deploy|kubernetes|machine room|serve|production)/.test(t))
    return go('machine-room', 'Scene four — production: vLLM on four A100s.')
  if (/(contact|email|resume|hire|reach|credits|experience|about)/.test(t))
    return go('credits', 'Rolling the credits — contacts and experience are there.')
  if (/(top|start|beginning|title|home)/.test(t))
    return go('title', 'Back to the title card.')
  return null
}
