## Context

Greenfield full-stack application for a coding challenge. Users submit natural language restaurant search requests; the system interprets them into structured parameters, calls Foursquare Places API, and returns results via a web UI and a JSON API. Stack is constrained to Node.js and TypeScript; frontend approach is flexible. Initial spec (RestaurantFinder.md) chooses Next.js App Router, Tailwind, OpenRouter for LLM, Zod for validation, Vitest for tests, and Cloudflare for deployment.

## Goals / Non-Goals

**Goals:**

- Single codebase serving both the UI and the GET `/api/execute` JSON endpoint.
- Reliable interpretation of natural language into validated SearchParams before any Foursquare call.
- Clear separation: auth gate → interpretation → Foursquare → response shaping.
- Usable UI with input, loading, errors, and readable results.
- Testable backend and parsing/validation logic; README and deployable artifact.

**Non-Goals:**

- Persistent storage, user accounts, or caching of results.
- Full e2e or browser tests for this scope.
- Support for non-Node/non-TypeScript runtimes.

## Decisions

- **Next.js App Router + TypeScript**: Meets Node.js/TypeScript requirement and provides both `/app/page.tsx` (UI) and `/app/api/execute/route.ts` (API) in one project. Alternative: Express + separate React app; rejected to avoid two servers and CORS.
- **OpenRouter for LLM**: Flexible model routing and standard HTTP API; output is parsed as JSON and validated with Zod before use. Alternative: local or other LLM provider; OpenRouter chosen for simplicity and reliability of structured output.
- **Zod for all structured data**: SearchParams (LLM output) and API response shapes are validated with Zod so invalid data never reaches Foursquare or the client. Alternative: manual checks; Zod gives a single, declarative source of truth.
- **JSON validation for both upstream APIs**: (1) **OpenRouter**: Response MUST be parsed as JSON and validated with SearchParams schema; use a dedicated **system prompt** (see `prompts/openrouter-system.md`) that defines what we send and that we expect JSON only. (2) **Foursquare**: Response MUST be parsed as JSON and validated against a Foursquare response schema before mapping; use a **request/response contract** (see `prompts/foursquare-contract.md`) for what we send and what we expect.
- **Single GET `/api/execute` for UI and API**: Frontend calls the same endpoint as external consumers; no separate “internal” API. Simplifies contract and avoids duplication.
- **Foursquare Place Search only for core flow**: Place Details used only if needed for extra fields (e.g., hours); primary results come from Place Search to limit latency and quota. Premium-only fields are skipped.
- **Vitest for tests**: Fast, TypeScript-native, minimal config; focuses on code validation, LLM parsing, Foursquare filtering, and error handling rather than e2e.
- **Frontend design context (teach-impeccable)**: Before or during frontend implementation, run the **teach-impeccable** skill once to gather and persist Design Context (users, brand, aesthetic, principles) in **.cursorrules** (Cursor project root). All frontend UI work SHALL follow that Design Context so the interface is consistent and on-brand.
- **Login page (demo credentials)**: A login page at `/login` with username **demo** and password **1234** (hardcoded for demo). On success, set a session (e.g. signed HTTP-only cookie or encrypted session cookie) and redirect to `/`. The root route `/` SHALL be protected: unauthenticated users are redirected to `/login`. Logout optional (e.g. clear session and redirect to `/login`). No user database; validate credentials server-side against the fixed pair only.
- **LLM rate limit (1 per 60 seconds per client)**: Enforced after auth, before calling the LLM; 429 when exceeded. Use a **rolling 60-second window**. On Cloudflare, use IP-based client identity via `CF-Connecting-IP` (fallback to `X-Forwarded-For` if needed) and implement the rate limit with a Cloudflare-native shared store (prefer **Durable Objects**) so it works across instances/regions as best as possible. In local dev, an in-memory map is acceptable; document the differences in README.

## Risks / Trade-offs

- **LLM output variability**: Malformed or off-schema JSON → Zod fails → 422 returned; Foursquare is never called with unvalidated params. Mitigation: clear prompt and response schema; retries or fallbacks are out of scope for this change.
- **Foursquare rate limits / downtime**: Handled as 502 with `{ error: "Upstream API error" }`; no retry or cache. Mitigation: document in README; future work could add retries or caching.
- **Secrets**: OPENROUTER_API_KEY and FOURSQUARE_API_KEY are server-side only (env vars); never exposed to the client. Mitigation: no key in client bundles; API route is the only caller.
- **Relevance of results**: Filtering and field selection are applied in code; “open now” and price are passed to Foursquare where supported. Mitigation: return only relevant fields; avoid dumping raw Foursquare payloads.
- **CORS**: External JSON consumers are assumed server-to-server unless otherwise needed. Browser clients from other origins may require CORS; document or enable if needed.
- **Rate limit UX**: 1 request per 60 seconds may feel strict to users; UI should show a clear message on 429 and optionally display retry_after. Document in README.
- **Message validation**: Treat whitespace-only `message` as empty (trim before check) and return 400. Optional: cap message length for GET URL limits (e.g. 2K–8K); if implemented, message over cap → 400 and the limit MUST be documented in README.
- **429 response**: The 429 response MUST include a `Retry-After: 60` response header in addition to the JSON body with `retry_after: 60`.
- **External services documentation**: README MUST document: (1) **Foursquare API** — base URL and API version (see `prompts/foursquare-contract.md`; document or override in README). (2) **OpenRouter** — the model ID used (implementation choice; pick one that supports structured/JSON output). (3) **Upstream timeouts** — the timeout value(s) used for OpenRouter and Foursquare requests (e.g. 10–15s); document in README or in code comments.

## Agent skills for improvement

The following project skills are available to improve this change (UX, design, performance, security, and implementation quality). Use them where they add value.

**MCP usage:** Prefer **jCodeMunch** MCP for codebase exploration (index the project, then use `search_symbols`, `get_symbol`, `get_file_outline`, `get_repo_outline`) and for navigating large files (500+ lines). Use **jDocMunch** MCP for reading and looking up documentation.

- **adapt** — Responsive and cross-device consistency  
- **agents-sdk** — AI agents on Cloudflare Workers  
- **animate** — Purposeful animations and micro-interactions  
- **audit** — Accessibility, performance, theming, responsive design  
- **bolder** — Stronger visual impact while keeping usability  
- **building-ai-agent-on-cloudflare** — Cloudflare AI agents  
- **building-mcp-server-on-cloudflare** — Remote MCP servers on Workers  
- **clarify** — Clearer UX copy, error messages, labels  
- **cloudflare** — Workers, Pages, storage, AI, networking  
- **colorize** — Strategic use of color  
- **critique** — UX and design effectiveness  
- **delight** — Joy, personality, memorable touches  
- **distill** — Simplicity and reduced complexity  
- **durable-objects** — Cloudflare Durable Objects  
- **extract** — Reusable components and design tokens  
- **frontend-design** — Production-grade frontend interfaces  
- **harden** — Error handling, i18n, edge cases  
- **normalize** — Design system consistency  
- **onboard** — Onboarding, empty states, first-time UX  
- **optimize** — Performance (load, render, bundle)  
- **polish** — Alignment, spacing, consistency  
- **quieter** — Toned-down intensity when needed  
- **sandbox-sdk** — Sandboxed code execution  
- **teach-impeccable** — One-time design context setup  
- **web-perf** — Core Web Vitals, Lighthouse, speed  
- **workers-best-practices** — Cloudflare Workers production patterns  
- **wrangler** — Workers CLI and deployment
