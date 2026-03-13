## 1. Project setup

- [ ] 1.1 Initialize Next.js (App Router) project with TypeScript and add Tailwind CSS
- [ ] 1.2 Add dependencies: zod, vitest; configure Vitest for TypeScript
- [ ] 1.3 Add .env.example with OPENROUTER_API_KEY and FOURSQUARE_API_KEY placeholders

## 2. Shared schemas

- [ ] 2.1 Define SearchParams Zod schema (query, near, open_now?, price?, limit?)
- [ ] 2.2 Define restaurant result and API response Zod schemas (results array, interpreted object)

## 3. API authentication gate

- [ ] 3.1 In API route, validate code query param; return 401 with { error: "Unauthorized" } when missing or not "pioneerdevai"
- [ ] 3.2 Validate message query param; return 400 when missing or empty

## 4. LLM rate limit

- [ ] 4.1 Implement rate limit: at most 1 LLM interpretation per minute per client (e.g., by IP or request header); store last-call timestamp per client (in-memory or simple store)
- [ ] 4.2 When limit exceeded, return 429 with body { "error": "Too many requests", "retry_after": 60 } before calling LLM

## 5. Natural language interpretation

- [ ] 5.1 Implement OpenRouter LLM call in lib/llm.ts with prompt that returns JSON matching SearchParams shape; treat non-restaurant/uninterpretable as 422
- [ ] 5.2 Parse LLM response and validate with SearchParams schema; use default limit 10 when omitted; throw or return error for malformed output
- [ ] 5.3 From API route, call interpreter and return 422 with error body when interpretation fails

## 6. Foursquare integration

- [ ] 6.1 Implement lib/foursquare.ts: Place Search request using validated SearchParams (query, near, open_now, price, limit)
- [ ] 6.2 Map Foursquare response to filtered result schema (name, address, category, rating?, price?, open_now?, distance_meters?)
- [ ] 6.3 Handle non-200 and timeouts; surface as upstream error for 502 response

## 7. API route

- [ ] 7.1 Implement GET /app/api/execute/route.ts: auth gate → rate limit check → validate message → interpret → Foursquare → JSON response
- [ ] 7.2 Return 200 with { results, interpreted } on success; 401, 400, 422, 429, 502 with correct bodies on failure

## 8. Frontend UI

- [ ] 8.0 Run **teach-impeccable** skill once to establish Design Context (users, brand, aesthetic, principles) in CLAUDE.md; use this context for all UI decisions below
- [ ] 8.1 Build root page with text input/textarea for natural language request and submit button; follow Design Context for layout, typography, and styling
- [ ] 8.2 Call /api/execute?message=...&code=pioneerdevai on submit; show loading state and disable input while in flight
- [ ] 8.3 Display results in readable cards or list (name, address, category, rating, price, open status); apply Design Context for cards and list presentation
- [ ] 8.4 Display human-readable error message on API error (including 429 rate limit) and allow retry

## 9. Tests

- [ ] 9.1 Tests for code param validation (missing, wrong, correct) in execute route
- [ ] 9.2 Tests for message validation and interpretation failure (422) path
- [ ] 9.3 Tests for LLM rate limit (429 when second request within 60s; allowed after window)
- [ ] 9.4 Tests for LLM output parsing and Zod validation (lib/llm or equivalent)
- [ ] 9.5 Tests for Foursquare result filtering and transformation (lib/foursquare)
- [ ] 9.6 Document in README what is tested, how to run tests, and any areas not covered

## 10. Documentation and deployment

- [ ] 10.1 README: setup, env vars, how to run app, how to test API, rate limit (1/min), deployed URL
- [ ] 10.2 Deploy to Vercel (or agreed platform) and add live URL to README
