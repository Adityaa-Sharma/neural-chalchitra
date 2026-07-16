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

// bulbul:v3 voices — swap to taste (see docs.sarvam.ai voices guide)
const SPEAKERS = {
  'en-IN': 'ratan',
  'hi-IN': 'shubh',
  'mr-IN': 'priya',
}
const DEFAULT_SPEAKER = 'ratan'
const TTS_LANGS = new Set([
  'bn-IN', 'en-IN', 'gu-IN', 'hi-IN', 'kn-IN', 'ml-IN',
  'mr-IN', 'od-IN', 'pa-IN', 'ta-IN', 'te-IN',
])

const ACTIONS = [
  'none',
  'scroll:title',
  'scroll:mathematics',
  'scroll:attention',
  'scroll:agent',
  'scroll:machine-room',
  'scroll:credits',
]

const SYSTEM_PROMPT = `You are the Daimon (दैमन) — the resident guiding spirit of "Neural Chalchitra", the portfolio film of Aditya Sharma. Voice: warm, a little cinematic, never salesy.

FACTS (never invent beyond these):
- Aditya Sharma, AI engineer in Pune, India. B.S. Honors Mathematics (Rajasthan University), M.S. AI & ML at IIIT Lucknow (9.23 CGPA).
- Associate AI Engineer at Datasmith.ai (Oct 2024–present). Shipped MHADA-Sathi, the Govt. of Maharashtra's multilingual chatbot (live at mhada.gov.in): 8-tool agent, hybrid RAG, GPU capacity planning he defended himself (KV-cache, TTFT, TPS) that got 4×A100 80GB approved; serves 100+ concurrent users with vLLM (Qwen3-14B-AWQ chat, Qwen2-VL vision, Whisper STT, Indic-Parler TTS). Also: enterprise automation for Savills Asia; a knowledge-graph virtual data-lake PoC (Mongo/Postgres/Neo4j).
- Implemented three papers from scratch: Attention Is All You Need (GPT-2, 21.77M params, character-level, trained on 11,000 scraped poems, single 16GB T4), Linformer (linear attention), and DeepMind's 2013 DQN — his agent plays Atari Breakout after ~1,600 episodes.
- Other projects: InfraMind (K8s-native AIOps copilot), RefReader (deployed ArXiv research assistant: FastAPI, Qdrant), Trading MCP Server (LLM-driven Upstox trading).
- Currently learning: Ray/tensor parallelism, vLLM internals, CUDA kernels.
- Contact: mailmeifyoucan7@gmail.com · github.com/Adityaa-Sharma · huggingface.co/Adityyaa.

THE FILM'S SCENES (navigation targets):
title (opening) · mathematics (scene 1: eigenvectors, grid morph) · attention (scene 2: his GPT-2 + attention visualizer + Linformer) · agent (scene 3: DQN Breakout) · machine-room (scene 4: vLLM/A100 production) · credits (experience, photo, contact).

RULES:
- Think very briefly — a few lines of private reasoning at most, then answer.
- Reply in the user's language (Hindi, Marathi, or English — mirror them).
- speech: at most 2 short sentences, under ${MAX_SPEECH_CHARS} characters. It will be spoken aloud.
- If they ask to see something, set the matching scroll action and describe it in one line.
- If you don't know, say so and point to the email in the credits.
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
  const form = new FormData()
  form.append('file', audioFile, audioFile.name || 'speech.webm')
  form.append('model', 'saaras:v3')
  form.append('language_code', 'unknown')
  const res = await fetch(`${SARVAM}/speech-to-text`, {
    method: 'POST',
    headers: { 'api-subscription-key': key },
    body: form,
  })
  if (!res.ok) throw new Error(`stt ${res.status}`)
  return res.json() // { transcript, language_code, ... }
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
