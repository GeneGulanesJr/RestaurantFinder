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

## 4. Natural language interpretation

- [ ] 4.1 Implement OpenRouter LLM call in lib/llm.ts with prompt that returns JSON matching SearchParams shape
- [ ] 4.2 Parse LLM response and validate with SearchParams schema; throw or return error for malformed output
- [ ] 4.3 From API route, call interpreter and return 422 with error body when interpretation fails

## 5. Foursquare integration

- [ ] 5.1 Implement lib/foursquare.ts: Place Search request using validated SearchParams (query, near, open_now, price, limit)
- [ ] 5.2 Map Foursquare response to filtered result schema (name, address, category, rating?, price?, open_now?, distance_meters?)
- [ ] 5.3 Handle non-200 and timeouts; surface as upstream error for 502 response

## 6. API route

- [ ] 6.1 Implement GET /app/api/execute/route.ts: auth gate → validate message → interpret → Foursquare → JSON response
- [ ] 6.2 Return 200 with { results, interpreted } on success; 401, 400, 422, 502 with correct bodies on failure

## 7. Frontend UI

- [ ] 7.1 Build root page with text input/textarea for natural language request and submit button
- [ ] 7.2 Call /api/execute?message=...&code=pioneerdevai on submit; show loading state and disable input while in flight
- [ ] 7.3 Display results in readable cards or list (name, address, category, rating, price, open status)
- [ ] 7.4 Display human-readable error message on API error and allow retry

## 8. Tests

- [ ] 8.1 Tests for code param validation (missing, wrong, correct) in execute route
- [ ] 8.2 Tests for message validation and interpretation failure (422) path
- [ ] 8.3 Tests for LLM output parsing and Zod validation (lib/llm or equivalent)
- [ ] 8.4 Tests for Foursquare result filtering and transformation (lib/foursquare)
- [ ] 8.5 Document in README what is tested, how to run tests, and any areas not covered

## 9. Documentation and deployment

- [ ] 9.1 README: setup, env vars, how to run app, how to test API, deployed URL
- [ ] 9.2 Deploy to Vercel (or agreed platform) and add live URL to README
