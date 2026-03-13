## 1. Project setup

- [x] 1.1 Initialize Next.js (App Router) project with TypeScript and add Tailwind CSS
- [x] 1.2 Add dependencies: zod, vitest; configure Vitest for TypeScript
- [x] 1.3 Add .env.example with OPENROUTER_API_KEY and FOURSQUARE_API_KEY placeholders

## 2. Shared schemas and API contracts

- [x] 2.1 Define SearchParams Zod schema (query, near, open_now?, price?, limit?)
- [x] 2.2 Define restaurant result and API response Zod schemas (results array, interpreted object)
- [x] 2.3 Define Zod schema for raw Foursquare Place Search response (for JSON validation before mapping)

## 3. API authentication gate

- [x] 3.1 In API route, validate code query param; return 401 with { error: "Unauthorized" } when missing or not "pioneerdevai"
- [x] 3.2 Validate message query param: trim then return 400 when missing, empty, or whitespace-only; optionally enforce max length and return 400 if exceeded (document limit in README)

## 4. LLM rate limit

- [x] 4.1 Implement rate limit: at most 1 LLM interpretation per rolling 60 seconds per client; on Cloudflare identify client by IP (CF-Connecting-IP, fallback X-Forwarded-For) and store last-call timestamp in a shared store (prefer Durable Objects); local dev can use in-memory
- [x] 4.2 When limit exceeded, return 429 with body { "error": "Too many requests", "retry_after": 60 } and Retry-After: 60 response header, before calling LLM

## 5. Natural language interpretation

- [x] 5.1 Implement OpenRouter LLM call in lib/llm.ts using system prompt from prompts/openrouter-system.md (what to send, expect JSON only)
- [x] 5.2 Parse OpenRouter response as JSON; if parse fails return 422; validate parsed object with SearchParams Zod schema; use default limit 10 when omitted; throw or return error for malformed or invalid output
- [x] 5.3 From API route, call interpreter and return 422 with error body when interpretation fails

## 6. Foursquare integration

- [x] 6.1 Implement lib/foursquare.ts per prompts/foursquare-contract.md: Place Search request (what we send) using validated SearchParams
- [x] 6.2 Parse Foursquare response as JSON; validate with Foursquare response Zod schema; if parse or validation fails return 502; then map to filtered result schema (name, address, category, rating?, price?, open_now?, distance_meters?)
- [x] 6.3 Handle non-200 and timeouts; surface as upstream error for 502 response

## 7. Login and session

- [x] 7.1 Add login page at /login: form with username and password; POST to /api/login (or equivalent) with credentials
- [x] 7.2 Implement login API: validate username === "demo" and password === "1234"; on success set session cookie (signed/encrypted) and return success; on failure return 401 or redirect with error
- [x] 7.3 Protect /: middleware or page check for valid session; redirect to /login if not authenticated
- [x] 7.4 Optional: logout endpoint or client action that clears session and redirects to /login

## 8. API route (execute)

- [x] 8.1 Implement GET /app/api/execute/route.ts: auth gate → rate limit check → validate message → interpret → Foursquare → JSON response
- [x] 8.2 Return 200 with { results, interpreted } on success; 401, 400, 422, 429, 502 with correct bodies on failure

## 9. Frontend UI

- [x] 9.0 Run **teach-impeccable** skill once to establish Design Context (users, brand, aesthetic, principles) in **.cursorrules** (Cursor); use this context for all UI decisions below
- [x] 9.1 Build login page at /login (username, password, submit); follow Design Context; show error on invalid credentials
- [x] 9.2 Build root page (protected): text input/textarea for natural language request and submit button; follow Design Context for layout, typography, and styling; redirect to /login if not authenticated
- [x] 9.3 Call /api/execute?message=...&code=pioneerdevai on submit; show loading state and disable input while in flight
- [x] 9.4 Display results in readable cards or list (name, address, category, rating, price, open status); apply Design Context for cards and list presentation
- [x] 9.5 Display human-readable error message on API error (including 429 rate limit) and allow retry; optional: logout button

## 10. Tests

- [x] 10.1 Tests for code param validation (missing, wrong, correct) in execute route
- [x] 10.2 Tests for message validation and interpretation failure (422) path
- [x] 10.3 Tests for LLM rate limit (429 when second request within 60s; allowed after window)
- [x] 10.4 Tests for LLM: JSON parse failure and SearchParams Zod validation (lib/llm or equivalent)
- [x] 10.5 Tests for Foursquare: JSON parse and response schema validation, then filtering/transformation (lib/foursquare)
- [x] 10.6 Tests for login: valid demo/1234 accepts; invalid credentials reject
- [x] 10.7 Document in README what is tested, how to run tests, and any areas not covered

## 11. Documentation and deployment

- [x] 11.1 README: setup, env vars, how to run app, login (demo/1234), how to test API, rate limit (1 per 60s per client; rolling; Cloudflare headers + store choice), deployed URL; document Foursquare API base URL/version, OpenRouter model ID, upstream timeout value(s); if message max length is enforced, document the limit
- [ ] 11.2 Deploy to Cloudflare (e.g., Pages/Workers) and add live URL to README
