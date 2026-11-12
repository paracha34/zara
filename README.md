# ZARA AI — Cloudflare Pages + Workers AI

## Production architecture

- React/Vite frontend is deployed to Cloudflare Pages.
- `functions/[[path]].ts` forwards `/api/*` requests to the shared API handler in `workers/api.ts`.
- Text chat and website generation use the native Cloudflare Workers AI binding with `@cf/zai-org/glm-4.7-flash`.
- Audio transcription fallback uses `@cf/openai/whisper-large-v3-turbo`.
- No Gemini or Google Cloud TTS key is required by the production Pages runtime.

## Cloudflare setup

The repository's `wrangler.toml` declares the Pages output directory and native AI binding:

```toml
name = "zara"
pages_build_output_dir = "./dist"

[ai]
binding = "AI"
```

In the Cloudflare Pages project, keep the Git integration connected to this repository and use:

- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: repository root

The AI binding is declared in Wrangler configuration. If the dashboard asks for a binding separately, add a Workers AI binding named `AI`.

## Local development

Install dependencies with `npm install`, then run `npm run dev`. This builds the frontend and starts the Pages local development server using Wrangler and the configured AI binding.

## Voice behavior and limitations

- Speech recognition first uses the browser's native Web Speech API when available.
- If native speech recognition is unavailable, the app records microphone audio and sends it to the Workers AI Whisper endpoint at `POST /api/stt`.
- Speech output uses browser/OS speech synthesis. The app prefers an installed Urdu voice and does not deliberately select an English voice for Urdu text.
- Workers AI currently does not provide a supported Urdu (Pakistan) TTS voice for this application. A natural female Urdu voice cannot be guaranteed without a compatible installed OS/browser voice or a separate Urdu TTS provider.

## API endpoints

- `GET /api/health`
- `POST /api/chat`
- `POST /api/generate-website`
- `POST /api/stt`
- `POST /api/tts` (returns a documented browser-fallback response)
- `GET/POST /api/websites`
- `GET/POST /api/reminders`
- `GET/POST /api/settings`

## Important storage note

Chat history remains in browser localStorage. The current API's website, reminder, and settings collections are still in-memory and reset when the Pages Function isolate restarts. Add a provisioned KV or D1 binding before treating those records as durable cross-session/cloud data.
