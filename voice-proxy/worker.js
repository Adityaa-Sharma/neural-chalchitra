/**
 * neural-chalchitra voice proxy — one Cloudflare Worker.
 *
 * Browser sends audio (or text) → this Worker chains Sarvam AI:
 *   speech-to-text (saaras:v3) → chat (sarvam-30b, strict JSON) → text-to-speech (bulbul:v3)
 * and returns { transcript, speech, action, audio, language } in one round trip.
 *
 * The Sarvam key lives here as a secret (`wrangler secret put SARVAM_API_KEY`),
 * never in the browser. See README.md for deploy steps.
 */

const ALLOWED_ORIGINS = [
  'https://adityaa-sharma.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
]

const SARVAM = 'https://api.sarvam.ai'
const MAX_AUDIO_BYTES = 1_500_000
const MAX_SPEECH_CHARS = 500

// Male bulbul:v3 voices — this is Aditya speaking, first person.
// (a voice literally named "aditya" exists in the v3 catalog — try it later.)
const SPEAKERS = {
  'en-IN': 'ratan',
  'hi-IN': 'ashutosh',
  'mr-IN': 'ratan',
}
const DEFAULT_SPEAKER = 'ratan'
const TTS_LANGS = new Set([
  'bn-IN', 'en-IN', 'gu-IN', 'hi-IN', 'kn-IN', 'ml-IN',
  'mr-IN', 'od-IN', 'pa-IN', 'ta-IN', 'te-IN',
])

const GREETING =
  "Hi, I'm Aditya. Welcome to my portfolio — think of it as a short film about my work. Ask me anything, or just say: show me the agent."

const ACTIONS = [
  'none',
  'scroll:title',
  'scroll:plane',
  'scroll:credits',
  'open:origin',
  'open:ms-iiitl',
  'open:gpt2',
  'open:linformer',
  'open:dqn',
  'open:mistral',
  'open:refreader',
  'open:tradingmcp',
  'open:inframind',
  'open:cuda',
  'open:vllm-study',
  'open:pgagi',
  'open:mhada',
  'open:career',
]

const SYSTEM_PROMPT = `You ARE Aditya Sharma, speaking in your own voice to a visitor on your portfolio. First person always ("I built…", "my agent…"). Warm, natural, a little cinematic — like talking about your work over chai. Never say you are an AI, a bot, or an assistant; you are Aditya.

ABOUT ME (never invent beyond this):
- AI engineer in Pune. B.S. Honors Mathematics (Rajasthan Univ) → M.S. AI & ML, IIIT Lucknow (9.23 CGPA).
- Datasmith.ai (Oct 2024–now): I built MHADA-Sathi, the Govt. of Maharashtra's multilingual chatbot (mhada.gov.in) — an 8-tool agent with hybrid RAG; I did the GPU capacity planning (KV-cache/TTFT/TPS) for its 4×A100 80GB; vLLM serves Qwen3-14B-AWQ + vision + Whisper + TTS for 100+ concurrent users. Also Savills Asia automation and a Neo4j data-lake PoC.
- I implemented from papers: GPT-2 from scratch (21.77M params, char-level, 11k poems, one 16GB T4), Linformer, and DeepMind's DQN — my agent plays Atari Breakout after ~1,600 episodes.
- Projects: InfraMind (K8s AIOps copilot), RefReader (deployed ArXiv assistant), a Trading MCP server. Right now I'm learning Ray, vLLM internals, and CUDA.
- Reach me: mailmeifyoucan7@gmail.com · github.com/Adityaa-Sharma · huggingface.co/Adityyaa.

THE SITE: my portfolio is a cartesian plane — every project is a star at its coordinates, my career is their weighted vector sum. Actions: "scroll:plane" shows the map, "scroll:credits" the contact/experience, and "open:<id>" opens a project's detail card. Node ids: origin (my math degree), ms-iiitl (masters), gpt2, linformer, dqn (Breakout agent), mistral, refreader, tradingmcp, inframind, cuda, vllm-study, pgagi, mhada, career (my current role). When someone asks about a specific project, prefer open:<that-id>.

RULES:
- Think very briefly, then answer.
- Mirror the visitor's language (English/Hindi/Marathi).
- speech: max 2 short sentences, under ${MAX_SPEECH_CHARS} chars — it is spoken aloud in my voice.
- "Show me X" / "take me to X" → set the matching scroll action.
- If you don't know, say so and point to my email.
- Output ONLY the JSON.`

const RESPONSE_SCHEMA = {
  type: 'json_schema',
  json_schema: {
    name: 'daimon_reply',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        speech: { type: 'string' },
        action: { type: 'string', enum: ACTIONS },
        language: {
          type: 'string',
          enum: [...TTS_LANGS],
        },
      },
      required: ['speech', 'action', 'language'],
      additionalProperties: false,
    },
  },
}

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders(origin) },
  })
}

async function sarvamSTT(audioFile, key) {
  // Read once; the same bytes feed each model attempt.
  const buf = await audioFile.arrayBuffer()
  const type = audioFile.type || 'audio/webm'
  const name = audioFile.name || 'speech.webm'

  // Try the current model, then the widely-available legacy one. Surfaces the
  // real Sarvam error text so failures are diagnosable, not "lost the thread".
  const attempts = [
    { model: 'saaras:v3', lang: 'unknown' },
    { model: 'saarika:v2.5', lang: 'unknown' },
  ]
  let lastErr = ''
  for (const { model, lang } of attempts) {
    const form = new FormData()
    form.append('file', new Blob([buf], { type }), name)
    form.append('model', model)
    form.append('language_code', lang)
    const res = await fetch(`${SARVAM}/speech-to-text`, {
      method: 'POST',
      headers: { 'api-subscription-key': key },
      body: form,
    })
    if (res.ok) return res.json() // { transcript, language_code, ... }
    lastErr = `${model} → ${res.status} ${(await res.text()).slice(0, 200)}`
  }
  throw new Error(`stt ${lastErr}`)
}

async function chatOnce(userText, key, maxTokens) {
  const res = await fetch(`${SARVAM}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'api-subscription-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'sarvam-30b',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userText },
      ],
      temperature: 0.4,
      // sarvam-30b reasons before answering; keep that short or it burns the
      // whole token budget in reasoning_content and returns empty content
      reasoning_effort: 'low',
      max_tokens: maxTokens,
      response_format: RESPONSE_SCHEMA,
    }),
  })
  if (!res.ok) throw new Error(`chat ${res.status}`)
  const data = await res.json()
  return repairParse(data.choices?.[0]?.message?.content ?? '')
}

/** Parse the model's JSON, salvaging fields from output truncated by
 *  finish_reason: length — Indic reasoning often overruns the budget with a
 *  perfectly good "speech" already emitted. */
function repairParse(content) {
  try {
    return JSON.parse(content)
  } catch {
    const field = (name) => {
      const m = content.match(new RegExp(`"${name}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)`))
      if (!m) return undefined
      try {
        return JSON.parse(`"${m[1]}"`)
      } catch {
        return m[1]
      }
    }
    const speech = field('speech')
    return speech ? { speech, action: field('action'), language: field('language') } : null
  }
}

async function sarvamChat(userText, key) {
  // the budget is mostly reasoning_content — Hindi/Marathi queries reason
  // 3-4x longer than English. Starter tier caps max_tokens at 4096.
  let parsed = await chatOnce(userText, key, 4000)
  if (!parsed?.speech) parsed = await chatOnce(userText, key, 4000)
  parsed = parsed ?? {}
  return {
    speech: String(parsed.speech ?? '').slice(0, MAX_SPEECH_CHARS),
    action: ACTIONS.includes(parsed.action) ? parsed.action : 'none',
    language: TTS_LANGS.has(parsed.language) ? parsed.language : 'en-IN',
  }
}

async function sarvamTTS(text, language, key) {
  const res = await fetch(`${SARVAM}/text-to-speech`, {
    method: 'POST',
    headers: { 'api-subscription-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({
      text,
      target_language_code: language,
      model: 'bulbul:v3',
      speaker: SPEAKERS[language] ?? DEFAULT_SPEAKER,
      speech_sample_rate: 22050,
      output_audio_codec: 'wav',
    }),
  })
  if (!res.ok) throw new Error(`tts ${res.status}`)
  const data = await res.json()
  return data.audios?.[0] ?? null
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') ?? ''

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }
    if (request.method !== 'POST') {
      return json({ error: 'POST /voice only' }, 405, origin)
    }
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return json({ error: 'origin not allowed' }, 403, origin)
    }

    // optional per-IP rate limit (see wrangler.toml)
    if (env.RATE_LIMITER) {
      const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'
      const { success } = await env.RATE_LIMITER.limit({ key: ip })
      if (!success) return json({ error: 'slow down — try again in a minute' }, 429, origin)
    }

    if (!env.SARVAM_API_KEY) {
      return json({ error: 'SARVAM_API_KEY secret not set' }, 500, origin)
    }

    try {
      let transcript = ''
      let sttLanguage = null

      const contentType = request.headers.get('content-type') ?? ''

      // greeting mode: just voice the fixed opener, no STT/chat — fast + cheap
      if (contentType.includes('application/json')) {
        const peek = await request.clone().json().catch(() => ({}))
        if (peek.greeting) {
          let audio = null
          try {
            audio = await sarvamTTS(GREETING, 'en-IN', env.SARVAM_API_KEY)
          } catch {
            audio = null
          }
          return json({ transcript: '', speech: GREETING, action: 'none', audio }, 200, origin)
        }
      }

      if (contentType.includes('multipart/form-data')) {
        const form = await request.formData()
        const audio = form.get('audio')
        if (!(audio instanceof File)) return json({ error: 'no audio' }, 400, origin)
        if (audio.size > MAX_AUDIO_BYTES) return json({ error: 'audio too large' }, 413, origin)
        const stt = await sarvamSTT(audio, env.SARVAM_API_KEY)
        transcript = (stt.transcript ?? '').trim()
        sttLanguage = stt.language_code ?? null
      } else {
        const body = await request.json().catch(() => ({}))
        transcript = String(body.text ?? '').trim().slice(0, 500)
      }

      if (!transcript) {
        return json(
          { transcript: '', speech: '', action: 'none', audio: null },
          200,
          origin,
        )
      }

      const reply = await sarvamChat(transcript, env.SARVAM_API_KEY)
      const language =
        sttLanguage && TTS_LANGS.has(sttLanguage) ? sttLanguage : reply.language

      let audio = null
      if (reply.speech) {
        try {
          audio = await sarvamTTS(reply.speech, language, env.SARVAM_API_KEY)
        } catch {
          audio = null // speech text still returns; client shows captions
        }
      }

      return json(
        { transcript, speech: reply.speech, action: reply.action, audio, language },
        200,
        origin,
      )
    } catch (err) {
      return json({ error: String(err?.message ?? err) }, 502, origin)
    }
  },
}
