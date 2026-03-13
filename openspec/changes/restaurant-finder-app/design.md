## Context

Greenfield full-stack application for a coding challenge. Users submit natural language restaurant search requests; the system interprets them into structured parameters, calls Foursquare Places API, and returns results via a web UI and a JSON API. Stack is constrained to Node.js and TypeScript; frontend approach is flexible. Initial spec (RestaurantFinder.md) chooses Next.js App Router, Tailwind, OpenRouter for LLM, Zod for validation, Vitest for tests, and Vercel for deployment.

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
- **Single GET `/api/execute` for UI and API**: Frontend calls the same endpoint as external consumers; no separate “internal” API. Simplifies contract and avoids duplication.
- **Foursquare Place Search only for core flow**: Place Details used only if needed for extra fields (e.g., hours); primary results come from Place Search to limit latency and quota. Premium-only fields are skipped.
- **Vitest for tests**: Fast, TypeScript-native, minimal config; focuses on code validation, LLM parsing, Foursquare filtering, and error handling rather than e2e.

## Risks / Trade-offs

- **LLM output variability**: Malformed or off-schema JSON → Zod fails → 422 returned; Foursquare is never called with unvalidated params. Mitigation: clear prompt and response schema; retries or fallbacks are out of scope for this change.
- **Foursquare rate limits / downtime**: Handled as 502 with `{ error: "Upstream API error" }`; no retry or cache. Mitigation: document in README; future work could add retries or caching.
- **Secrets**: OPENROUTER_API_KEY and FOURSQUARE_API_KEY are server-side only (env vars); never exposed to the client. Mitigation: no key in client bundles; API route is the only caller.
- **Relevance of results**: Filtering and field selection are applied in code; “open now” and price are passed to Foursquare where supported. Mitigation: return only relevant fields; avoid dumping raw Foursquare payloads.
- **CORS**: External JSON consumers are assumed server-to-server unless otherwise needed. Browser clients from other origins may require CORS; document or enable if needed.

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
