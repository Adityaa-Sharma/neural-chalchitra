# Voice Proxy — the Daimon's brain

One Cloudflare Worker that keeps your Sarvam API key secret and chains, in a
single round trip:

```
browser audio ──► speech-to-text (saaras:v3)
              ──► chat (sarvam-30b, strict JSON: speech + scroll action)
              ──► text-to-speech (bulbul:v3, Indian voices)
              ◄── { transcript, speech, action, audio (base64 wav), language }
```

**Why this exists:** the portfolio is a static GitHub Pages site. Putting the
Sarvam key in the site's JavaScript would let anyone steal it and burn your
prepaid credits. This Worker holds the key server-side, only answers your
site's origin, and rate-limits per IP (8 req/min). Cloudflare's free plan
covers 100,000 requests **per day** — effectively unlimited for a portfolio.

## Deploy (one time, ~5 minutes)

1. **Get a Sarvam key**: sign up at [dashboard.sarvam.ai](https://dashboard.sarvam.ai)
   → API Keys. New accounts get free credits (₹100+; a Startup Program offers more).
   Costs after that are tiny: STT ₹30/hour of audio, TTS ₹30/10k chars, chat ~₹10/1M tokens.
   **Don't enable auto-recharge** — prepaid is your kill switch.

2. **Create a free Cloudflare account** at [dash.cloudflare.com](https://dash.cloudflare.com).

3. From this `voice-proxy/` folder:

   ```bash
   npx wrangler login                      # opens browser, authorize
   npx wrangler deploy                     # prints your worker URL
   npx wrangler secret put SARVAM_API_KEY  # paste the key when prompted
   ```

4. Copy the printed URL (like `https://neural-chalchitra-voice.<account>.workers.dev`)
   into [src/voice/voiceConfig.ts](../src/voice/voiceConfig.ts) →
   `VOICE_PROXY_URL`, then commit + push — the site redeploys itself.

## Notes

- Allowed origins are pinned in `worker.js` (`ALLOWED_ORIGINS`) — add your
  custom domain there if you attach one later.
- Voices: change the `SPEAKERS` map in `worker.js` (bulbul:v3 catalog includes
  ratan, ishita, shubh, priya, suhani, ashutosh, …).
- The daimon's knowledge lives in `SYSTEM_PROMPT` in `worker.js` — update it
  when your resume changes.
- Test after deploy:

  ```bash
  curl -X POST https://<your-worker-url>/voice \
    -H 'content-type: application/json' \
    -H 'Origin: https://adityaa-sharma.github.io' \
    -d '{"text":"show me the RL agent"}'
  ```

  Expect JSON with `speech`, `action: "scroll:agent"` and a base64 `audio`.
