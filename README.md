# Restaurant Finder

Full-stack app that interprets natural language restaurant requests, calls the Foursquare Places API, and returns results via a web UI and JSON API.

## Setup

- **Node.js** 18+
- **npm**

```bash
npm install
cp .env.example .env
# Edit .env and set the required keys (see below).
```

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | [OpenRouter](https://openrouter.ai) API key for LLM interpretation. |
| `FOURSQUARE_API_KEY` | Yes | [Foursquare Places API](https://docs.foursquare.com/fsq-developers-places/) key (v3). |
| `SESSION_SECRET` | Yes | Secret for signing session cookies (min 16 characters). |

See `.env.example` for placeholders.

### External services (documented values)

- **Foursquare**: Base URL `https://places-api.foursquare.com/places/search` with header `X-Places-Api-Version: 2025-06-17`. Use a [Service Key](https://docs.foursquare.com/developer/docs/manage-service-api-keys) in the `Authorization: Bearer <key>` header. See `lib/foursquare.ts`.
- **OpenRouter**: Model ID `openai/gpt-3.5-turbo`. See `lib/llm.ts` and `prompts/openrouter-system.md` in the OpenSpec change.
- **Upstream timeouts**: OpenRouter and Foursquare requests use a **15 second** timeout each. On timeout or non-200, the API returns 502.
- **Message max length**: The `message` query parameter is limited to **2000** characters (after trim). Longer messages return 400.

## Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to `/login` until you sign in.

### Login

- **URL**: `/login`
- **Demo credentials**: username **demo**, password **1234** (hardcoded; no user database).
- On success you are redirected to `/` (search UI).

## Test the API

**GET** `/api/execute` with query parameters:

- `code` (required): must be `pioneerdevai` (any other or missing → 401).
- `message` (required): natural language request, e.g. `Find cheap sushi in downtown LA open now`. Trimmed; max 2000 chars.

Example:

```bash
curl "http://localhost:3000/api/execute?code=pioneerdevai&message=Find%20pizza%20in%20Los%20Angeles"
```

- **200**: `{ "results": [...], "interpreted": { "query", "near", "limit", ... } }`
- **401**: `{ "error": "Unauthorized" }` — missing or wrong `code`
- **400**: missing/empty/whitespace or too-long `message`
- **422**: interpretation failed (malformed or uninterpretable message)
- **429**: rate limit exceeded (see below)
- **502**: upstream error (OpenRouter or Foursquare)

## Rate limit

- At most **1 LLM interpretation per rolling 60 seconds per client**.
- **Client identity**: On Cloudflare, client is identified by IP using `CF-Connecting-IP`, with fallback to `X-Forwarded-For`. Local dev uses the same headers when present; otherwise a single fallback id is used.
- **Store**: Local dev uses an **in-memory** map. For production on Cloudflare, use a **Durable Object** (or other shared store) so the limit is enforced across instances/regions; document the choice in this README when you deploy.
- When exceeded: **429** with body `{ "error": "Too many requests", "retry_after": 60 }` and response header **`Retry-After: 60`**. The LLM is not called.

## Testing

- **Runner**: [Vitest](https://vitest.dev) (`npm run test`).
- **What is tested**:
  - Execute route: `code` validation (missing, wrong, correct), `message` validation (missing, whitespace), interpretation failure (422), rate limit (429).
  - LLM (`lib/llm.ts`): invalid JSON response, SearchParams validation failure, uninterpretable response, valid response with default limit.
  - Foursquare (`lib/foursquare.ts`): non-JSON response, schema validation failure, successful response mapping.
  - Login API: valid `demo` / `1234` (200 + session cookie), invalid credentials (401).
- **Not covered**: E2E/browser tests; live OpenRouter/Foursquare calls (tests mock `fetch`).

```bash
npm run test
```

## Deployment (Cloudflare)

You can deploy to [Cloudflare Pages](https://developers.cloudflare.com/pages) (with Next.js support) or adapt for Workers.

1. Connect the repo to Cloudflare Pages and set the build command to `npm run build` and output directory to `.next` (or use the Next.js on Pages guide).
2. Set env vars in the dashboard: `OPENROUTER_API_KEY`, `FOURSQUARE_API_KEY`, `SESSION_SECRET`.
3. For production rate limiting across regions, implement the 60s limit using a [Durable Object](https://developers.cloudflare.com/durable-objects/) (or KV with TTL) and document it here.

**Live URL**: _(add your deployed URL here after deployment)_

## License

Private / coding challenge.
