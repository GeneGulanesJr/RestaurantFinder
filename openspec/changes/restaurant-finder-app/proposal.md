## Why

Users need to find restaurants by typing a natural language request (e.g., "Find me a cheap sushi restaurant in downtown Los Angeles that is open now"). The system must interpret that message into structured search parameters, query the Foursquare Places API, and deliver results through both a usable web UI and a JSON API endpoint. This change implements the full-stack Restaurant Finder as specified by the coding challenge and initial project spec.

## What Changes

- **New full-stack application** (Node.js + TypeScript): Next.js App Router with API route and frontend.
- **API authentication gate**: Validate `code === "pioneerdevai"` on every request; return 401 when missing or wrong.
- **Natural language interpretation**: Convert free-form user message to structured search params (query, near, open_now, price, limit) via LLM (OpenRouter), with Zod validation before any downstream call.
- **Foursquare integration**: Call Foursquare Place Search with validated params; filter and return only relevant restaurant fields (name, address, category, rating, price, open_now, etc.).
- **Frontend UI**: Text input/textarea, submit button, loading state, error handling, and a clean results view at `/`.
- **GET `/api/execute` contract**: Single endpoint for UI and external consumers; success JSON with `results` and `interpreted`; error responses 401, 400, 422, 429, 502.
- **LLM rate limit**: At most 1 interpretation (LLM) call per minute per client; return 429 when exceeded.
- **Automated tests**: Backend and parsing/validation logic (code validation, LLM output parsing, Foursquare result filtering, error handling).
- **README and deployment**: Setup instructions, env vars, how to run and test, deployed URL (e.g., Vercel).

## Capabilities

### New Capabilities

- `api-auth-gate`: Validates `code` query parameter; 401 when absent or not `pioneerdevai`.
- `natural-language-interpretation`: Converts user message to validated SearchParams (query, near, open_now, price, limit) via LLM + Zod; fails with 422 on malformed output.
- `foursquare-integration`: Foursquare Place Search and optional details; filtered, relevant result schema; 502 on upstream failure.
- `frontend-ui`: Root route UI with input, submit, loading, error display, and readable results (name, address, category, rating, price, hours/open status).
- `api-contract`: GET `/api/execute?message=...&code=pioneerdevai`; success and error response shapes; same endpoint for UI and JSON consumers; includes 429 for rate limit.
- `llm-rate-limit`: Enforce at most 1 LLM interpretation call per minute per client (e.g., per IP or per session); return 429 when exceeded.

### Modified Capabilities

- None (greenfield project).

## Impact

- New codebase: `/app`, `/lib`, `/tests`, config for Next.js, Tailwind, Vitest.
- Dependencies: Next.js, OpenRouter (LLM), Foursquare Places API client usage, Zod.
- Environment: `OPENROUTER_API_KEY`, `FOURSQUARE_API_KEY` (server-side only).
- Deployment target: Vercel (or similar) for live UI and API.
