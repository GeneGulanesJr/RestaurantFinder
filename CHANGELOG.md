# Changelog

## [Unreleased]

### Security Improvements

- **Removed hardcoded AUTH_CODE**: Moved AUTH_CODE to environment variable (`AUTH_CODE` env var must be set to enable). Previously hardcoded "pioneerdevai" was a security risk.
- **Added login rate limiting**: Implemented brute-force protection with 5 failed attempts per 5 minutes per IP. Added `checkLoginRateLimit`, `recordFailedLoginAttempt`, and `clearFailedLoginAttempts` functions to `lib/rate-limit.ts`.

### Performance Improvements

- **Parallel photo fetching**: Replaced sequential 3-second delay photo fetching with parallel batch processing using configurable concurrency (default: 2). Added `FOURSQUARE_PHOTOS_CONCURRENCY` env var. This reduces search latency from ~6s to ~2s for 3 places.

### Frontend Improvements

- **Request deduplication**: Added client-side request deduplication to prevent race conditions when user submits multiple searches rapidly.

### Code Quality

- **Improved error logging**: Added proper error logging for debugging while maintaining graceful degradation. Removed verbose debug console.log statements in production paths.

### Deployment

- **Cloudflare Pages install fix (EBADPLATFORM)**: Added npm `overrides` so `@esbuild/openharmony-arm64` is replaced with a local stub (`_stubs/openharmony-arm64`). The real package only supports OpenHarmony ARM64; on Linux x64 (Cloudflare build) it caused install to fail. The stub installs on all platforms and is never required at runtime on Pages.

### Frontend

- **Modern themed UI**: Added a token-driven theme (CSS variables + Tailwind mapping) and applied it consistently to `/login` and the root search UI (forms, buttons, alerts, results cards). Palette updated to a cleaner neutral base with a tomato accent so it feels more like a restaurant tool than a parchment-style app. Loaded new fonts via `next/font` and added consistent focus styling.
- **Motion and micro-interactions**: Added purposeful animations aligned with the animate skill: staggered entrance (fade + slide) on login and search, `rf-reveal` for error/interpreted/results, button hover/active scale and focus-ring transition. All motion respects `prefers-reduced-motion` (durations and delays near zero when reduced).
- **Bolder + delight pass**: Increased typographic drama in the hero header, added a lightweight background treatment (no images), and introduced tasteful loading/empty-state microcopy while keeping performance and accessibility as first-class constraints.

### Dependency and security

- **Packages updated to latest (no hotfix)**: Removed legacy-peer-deps workaround. Upgraded **Next.js** to `^16.1.6`, **React** to `^19.2.4`, **Zod** to `^3.25.76`, **Tailwind** to `^3.4.19`, **ESLint** to `^10`, **TypeScript** to `^5.9`, **Vitest** to `^4.1`, and related types. Replaced **@cloudflare/next-on-pages** with **@opennextjs/cloudflare** and **wrangler** `^4.65.0` for Cloudflare Workers deployment. Added `wrangler.jsonc`, `open-next.config.ts`, `public/_headers`, and scripts `preview` / `deploy`. All API routes and the root page use `runtime = "nodejs"` (OpenNext does not support Edge). README deployment section updated for OpenNext. `npm audit` reports **0 vulnerabilities**.

### Deployment

- **Edge Runtime for Cloudflare Pages**: Added `export const runtime = 'edge'` to all non-static routes so the build succeeds on Cloudflare Pages: `/api/csrf`, `/api/execute`, `/api/login`, `/api/logout`, and the root page (`/`).
- **Cloudflare Pages deploy fix**: README updated so Cloudflare deploy uses Pages (`wrangler pages deploy .next`) instead of Workers (`wrangler deploy`). If the dashboard has a custom deploy command, set it to `npx wrangler pages deploy .next --project-name=restaurantfinder`.
- **Next.js config**: Removed deprecated `swcMinify` from `next.config.ts` (invalid in Next.js 15; SWC minification is default).

### Security Improvements

- **Execute route accepts session or code**: `/api/execute` now authorizes via valid `code` query param or a valid session cookie, so logged-in UI requests (with cookies, no `code`) succeed and direct API callers can still use `code=pioneerdevai`.
- **Removed hardcoded AUTH_CODE from client-side**: Moved API authentication from client-side hardcoded code to server-side session-based authentication. The `code` parameter is no longer required; authentication is now handled via session cookies.
- **Implemented CSRF protection**: Added CSRF token generation and validation for all sensitive operations (login). Created `lib/csrf.ts` with timing-safe token comparison and `/api/csrf` endpoint for token generation.
- **Environment-based demo credentials**: Moved demo credentials (`DEMO_USERNAME`, `DEMO_PASSWORD`) to environment variables with secure defaults.
- **Improved rate limiting**: Upgraded from simple last-call tracking to sliding window algorithm with automatic cleanup. Added `getRateLimitStatus()` for monitoring and debugging.
- **Input validation**: Added Zod schema validation for login inputs (username length, password length, CSRF token).

### Code Quality Improvements

- **Centralized error handling**: Created `lib/api-error.ts` with `ApiError` class and `errorResponses` utility for consistent error responses across all endpoints.
- **Type safety**: Added Zod validation for API responses in client-side components (`SearchUI.tsx`). All API responses are now validated before use.
- **Configurable timeouts**: Made API timeouts configurable via environment variables (`OPENROUTER_TIMEOUT_MS`, `FOURSQUARE_TIMEOUT_MS`) with sensible defaults.
- **Configurable session TTL**: Made session TTL configurable via `SESSION_TTL_SEC` environment variable (default: 7 days).

### Performance Improvements

- **Sliding window rate limiting**: Implemented proper sliding window algorithm instead of simple last-call tracking for more accurate rate limiting.
- **Automatic cleanup**: Added periodic cleanup of old rate limit entries to prevent memory leaks.
- **Optimized rate limit recording**: Only record successful LLM interpretations, not failed attempts.

### Frontend Improvements

- **Rate limit countdown timer**: Added visual countdown timer when rate limit is exceeded. Submit button shows remaining time and is disabled during cooldown.
- **Logout loading state**: Added loading state and error handling for logout functionality.
- **Improved error messages**: Better error handling and user feedback for all error scenarios.
 - **Result descriptions**: Each restaurant result now includes a short, human-readable description that summarizes category, price, rating, and open status so it’s easier to scan and decide where to go.
 - **Query-aware “why it’s best” copy**: Expanded result descriptions to explicitly tie back to what the user asked for (query, location, “open now”, and price), briefly explaining why each place is a good match (or why it might not be ideal) for that specific search.
 - **Less-generic copy & wording fixes**: Refined description and “why it’s best” phrasing to feel more natural and brand-like (inspired by Squarespace-style web copy) and fixed awkward constructions like “near near me” by normalizing the interpreted location into friendlier language (“in your area”).
 - **Dynamic relevance-aware explanations**: Result copy now adapts by match quality (direct match, reasonable nearby option, or nearby alternative) using query keyword overlap, category type, distance, rating, open status, and budget intent so different restaurants no longer receive the same generic "strong match" message.
 - **Streaming text feedback**: Added ChatGPT-style streaming text animation for the interpreted query summary and each result’s address line in `SearchUI.tsx`, tuned to a slightly slower pace for readability, with automatic fallback to static text when `prefers-reduced-motion` is enabled.
 - **Guided search refinement modal**: Added a gamified `SearchRefinementModal` that appears for clearly vague queries, showing the original text, a progress indicator, and chip-based steps for cuisine, price, distance, rating, and open-now.
 - **Refinement-driven search flow**: `SearchUI` now builds a typed `SearchRequest`, classifies input with `classifySearchInput`, and either executes directly or routes users through the refinement modal with quick templates and a “Skip and search anyway” path before calling `/api/execute`.

### Testing Improvements

- **CSRF tests**: Added comprehensive test suite for CSRF protection (`lib/csrf.test.ts`) covering token generation, validation, and cookie handling.
- **Rate limit tests**: Added test suite for improved rate limiting (`lib/rate-limit.test.ts`) covering sliding window, cleanup, and status monitoring.

### Configuration Improvements

- **Next.js production optimizations**: Added React strict mode, image optimization, compression, SWC minification, and package import optimization.
- **Environment variable documentation**: Updated `.env.example` with all new configurable options and their defaults.

### Added

- **AI crawler / robots**: `app/robots.ts` generates a `robots.txt` that disallows common AI scrapers (GPTBot, ClaudeBot, Claude-Web, CCBot, PerplexityBot, Google-Extended, anthropic-ai, cohere-ai, FacebookBot, Bytespider, Amazonbot, Applebot-Extended, ChatGPT-User, OAI-SearchBot). Root layout includes meta tags asking GPTBot, Claude-Web, ClaudeBot, CCBot, PerplexityBot, and Google-Extended not to index or follow. This is advisory; well-behaved crawlers respect it; malicious scrapers may ignore it.
- **Wrangler and custom domain**: Added `wrangler` as a dev dependency, `wrangler.jsonc` (project name `restaurantfinder`), npm scripts `pages:create` and `deploy`. README updated with one-time setup for **restaurantfinder.genegulanesjr.com**: create Pages project, connect Git, add custom domain in dashboard (DNS/HTTPS auto when zone is on Cloudflare).
- **Restaurant Finder implementation** (OpenSpec change `restaurant-finder-app`): Next.js App Router app with TypeScript, Tailwind, Zod, Vitest. GET `/api/execute` with auth (`code=pioneerdevai`), message validation (trim, max 2000 chars), rolling 60s rate limit per client, OpenRouter LLM interpretation, Foursquare Place Search, and JSON responses (200/401/400/422/429/502). Login at `/login` (demo/1234), session protection for `/`, search UI with textarea, results cards, error/429 messaging, logout. README with setup, env vars, API contract, rate limit, testing, and deployment notes. Tests for execute route (code, message, 422, 429), LLM (JSON/validation/uninterpretable), Foursquare (parse/schema/map), and login. Constants moved to `lib/constants.ts` for Next.js route export constraint.
- OpenSpec change `restaurant-finder-app`: proposal, design, specs (api-auth-gate, natural-language-interpretation, foursquare-integration, frontend-ui, api-contract, llm-rate-limit), and tasks for full-stack Restaurant Finder implementation.
- **Spec updates**: Non-restaurant/uninterpretable message → 422; default `limit` fixed to 10; LLM rate limit 1 call per rolling 60 seconds per client (429 when exceeded); frontend must show clear message on 429; design and tasks updated for rate limit and renumbered.
- **Frontend + impeccable**: Frontend UI spec and design require using **teach-impeccable** to establish Design Context in **.cursorrules** (Cursor); tasks add 8.0 (run teach-impeccable once) and tie 8.1/8.3 to Design Context for layout, typography, and styling.
- **Clarifications**: SPEC-REVIEW "What's still unclear" added (rate limit client/rolling/edge, message validation, Foursquare/OpenRouter/timeout, 429 header, design context). Design/specs/tasks updated for Cloudflare: rolling 60s per-client rate limit, client key via `CF-Connecting-IP` (fallback `X-Forwarded-For`), shared store preference (Durable Objects); whitespace-only message → 400; query/near non-empty → 422; Retry-After header for 429; task 3.2 and api-contract/natural-language/llm-rate-limit specs aligned.
- **JSON validation and system prompts**: OpenRouter and Foursquare API calls must validate responses as JSON (parse + Zod). Added OpenRouter system prompt (`prompts/openrouter-system.md`) and Foursquare request/response contract (`prompts/foursquare-contract.md`) defining what we send and what we expect (JSON). Specs updated: natural-language-interpretation (system prompt + JSON parse/validate), foursquare-integration (contract + JSON parse/validate before map). Design and tasks updated (schemas 2.3, LLM 5.1–5.2, Foursquare 6.1–6.2, tests 9.4–9.5).
- **Login page**: Added login at `/login` with username **demo** and password **1234**; session-based protection of `/`; new capability `login-page`, spec `specs/login-page/spec.md`, design decision, tasks §7 (login + session) and §9 (login UI + protected root), tests 10.6; README to document demo/1234.
- **openspec/changes/restaurant-finder-app/design.md**: Added "Agent skills for improvement" section listing project skills (adapt, animate, audit, frontend-design, polish, etc.) that can be used to improve the implementation; added MCP usage note to prefer jCodeMunch for codebase exploration and jDocMunch for documentation.

### Changed

- **.gitignore**: Added Cursor/agent tooling entries (`.agents/`, `.cursor/commands/`, `.cursor/hooks/state/`, `.kilocode/`, `skills-lock.json`) so plugin cache, state, and lockfiles are not committed; unstaged those paths from the index.

### OpenSpec Changes

- **search-result-details-modal**: Added OpenSpec change for a search result details modal. Proposal, design, specs, and tasks define a flow where clicking a restaurant result opens an accessible modal that surfaces richer Foursquare data (address, contact info, website, metadata) without extra network calls, with clear selection state in the list and keyboard-accessible open/close behavior.
