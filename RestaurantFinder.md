# Restaurant Finder — Project Spec

## Overview

A full stack application that interprets natural language restaurant search requests, queries the Foursquare Places API, and returns structured results via both a web UI and a JSON API endpoint.

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Node.js + TypeScript required; handles UI and API in one project |
| Styling | Tailwind CSS | Fast to build with, no library overhead |
| LLM Interpretation | OpenRouter API | Flexible model routing, standard fetch-compatible |
| Places Data | Foursquare Places API | Required by the brief |
| Validation | Zod | Runtime schema validation for LLM output and API params |
| Testing | Vitest | TypeScript-native, fast, minimal config |
| Deployment | Vercel | Zero-config Next.js deployment, free tier |

### Environment Variables

```
OPENROUTER_API_KEY   — server-side only, never exposed to client
FOURSQUARE_API_KEY   — server-side only, never exposed to client
```

---

## Architecture

### Monorepo Structure

```
/app
  /api/execute/route.ts   ← GET endpoint (UI and external consumers share this)
  /page.tsx               ← Frontend UI
/lib
  /llm.ts                 ← OpenRouter call + Zod output validation
  /foursquare.ts          ← Foursquare Place Search + Details + result filtering
  /schemas.ts             ← Shared Zod schemas
/tests
  /execute.test.ts        ← API route validation tests
  /llm.test.ts            ← LLM output parsing tests
  /foursquare.test.ts     ← Result filtering and transformation tests
README.md
```

### Request Flow

```
User message (natural language)
  → GET /api/execute?message=...&code=pioneerdevai
    → Validate: code === "pioneerdevai" (401 if not)
    → Validate: message is non-empty string
    → LLM (OpenRouter): message → structured search params (JSON)
    → Zod: validate LLM output matches SearchParams schema
    → Foursquare Place Search: structured params → raw results
    → Filter: strip irrelevant fields, apply relevance logic
    → Return: clean JSON response
```

---

## Requirements

### Requirement: API Authentication Gate

The system MUST validate the `code` query parameter on every request.

#### Scenario: Missing code
- GIVEN a GET request to `/api/execute`
- WHEN the `code` parameter is absent or empty
- THEN the system returns HTTP 401 with `{ error: "Unauthorized" }`

#### Scenario: Wrong code
- GIVEN a GET request to `/api/execute`
- WHEN `code` is present but does not equal `"pioneerdevai"`
- THEN the system returns HTTP 401 with `{ error: "Unauthorized" }`

#### Scenario: Valid code
- GIVEN a GET request to `/api/execute`
- WHEN `code === "pioneerdevai"`
- THEN the request proceeds to message interpretation

---

### Requirement: Natural Language Interpretation

The system MUST convert a free-form user message into a validated structured search parameter object before any downstream API call is made.

#### Scenario: Well-formed message
- GIVEN a valid user message such as `"Find me cheap sushi in downtown LA that is open now"`
- WHEN the LLM returns a structured JSON object
- THEN the system validates it against the SearchParams Zod schema
- AND only proceeds to Foursquare if validation passes

#### Scenario: LLM returns malformed output
- GIVEN the LLM returns invalid or unparseable JSON
- WHEN Zod validation fails
- THEN the system returns HTTP 422 with a descriptive error
- AND Foursquare is never called

#### SearchParams Schema

```ts
{
  query: string           // e.g. "sushi", "pizza", "tacos"
  near: string            // e.g. "downtown Los Angeles"
  open_now?: boolean      // true if user requested open now
  price?: "1"|"2"|"3"|"4" // 1=cheap, 4=expensive
  limit?: number          // max results to return, default 10
}
```

---

### Requirement: Foursquare Integration

The system MUST query Foursquare Place Search using validated structured params and return filtered, relevant results.

#### Scenario: Successful search
- GIVEN valid SearchParams
- WHEN Foursquare Place Search returns results
- THEN the system returns only relevant fields per result
- AND results are ordered by relevance to the user's constraints

#### Scenario: Foursquare API failure
- GIVEN a valid request
- WHEN Foursquare returns a non-200 response or times out
- THEN the system returns HTTP 502 with `{ error: "Upstream API error" }`

#### Result Schema (per restaurant)

```ts
{
  name: string
  address: string
  category: string
  rating?: number
  price?: number          // 1–4
  open_now?: boolean
  distance_meters?: number
}
```

Fields marked `?` are included only when available. No extraneous data is returned.

---

### Requirement: Frontend UI

The system MUST provide a usable web interface at the root route `/`.

#### Scenario: Happy path
- GIVEN a user types a natural language request and submits
- WHEN the API returns results
- THEN results are displayed in a readable card or list format
- AND each result shows name, address, category, and any available rating/price/hours

#### Scenario: Loading state
- GIVEN the user has submitted a request
- WHEN the API call is in flight
- THEN a loading indicator is shown and the input is disabled

#### Scenario: Error state
- GIVEN the API returns an error
- WHEN the response is non-200
- THEN a human-readable error message is shown in the UI
- AND the user can retry

---

### Requirement: API Endpoint Contract

The system MUST expose a GET endpoint at `/api/execute`.

```
GET /api/execute?message=<encoded_query>&code=pioneerdevai
```

#### Success Response (200)

```json
{
  "results": [
    {
      "name": "Sugarfish",
      "address": "600 W 7th St, Los Angeles, CA",
      "category": "Sushi Restaurant",
      "rating": 8.9,
      "price": 2,
      "open_now": true,
      "distance_meters": 312
    }
  ],
  "interpreted": {
    "query": "sushi",
    "near": "downtown Los Angeles",
    "open_now": true,
    "price": "1"
  }
}
```

#### Error Responses

| Status | Body |
|---|---|
| 401 | `{ "error": "Unauthorized" }` |
| 400 | `{ "error": "message parameter is required" }` |
| 422 | `{ "error": "Could not interpret request", "detail": "..." }` |
| 502 | `{ "error": "Upstream API error" }` |

---

## Testing Requirements

Tests cover: `code` param validation, LLM output parsing and Zod schema validation, Foursquare result filtering and transformation, error handling for invalid input and upstream failures.

Run with: `pnpm test`

No e2e tests required for this scope.

---

## Constraints & Tradeoffs

- No persistent storage — results are not cached or saved
- No auth system — access gate is the `code` param only
- Foursquare free tier — premium fields (full hours, etc.) are skipped if unavailable
- LLM output is always validated before use — Foursquare is never called with unvalidated params
- Secrets are server-side only — no API keys are ever sent to the browser