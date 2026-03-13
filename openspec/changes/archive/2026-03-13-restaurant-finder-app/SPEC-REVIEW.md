# Spec Review: restaurant-finder-app

Review of OpenSpec artifacts against Task.md and RestaurantFinder.md. Items are categorized as **Wrong**, **Incomplete**, or **Needs clarification**.

---

## Wrong

- **None.** Specs align with the challenge and initial project spec; no contradictions found.

---

## Incomplete

### 1. Success response when there are zero results

- **Where:** api-contract, foursquare-integration
- **Issue:** Success scenario says "Foursquare returns results" and "the system returns only relevant fields per result." Behavior when Foursquare returns 0 hits is unspecified.
- **Fix:** Explicitly allow HTTP 200 with `results: []` and `interpreted` present. Foursquare spec should state that zero results is a valid outcome.

### 2. Default value for `limit`

- **Where:** natural-language-interpretation, proposal
- **Issue:** RestaurantFinder.md says `limit?: number` with "default 10." The spec does not state the default.
- **Fix:** Add that when `limit` is omitted from interpreted params, the system SHALL use a default (e.g., 10) before calling Foursquare.

### 3. Address when Foursquare does not provide it

- **Where:** foursquare-integration, api-contract
- **Issue:** Result schema requires each result to include `name`, `address`, `category`. Foursquare may omit address for some places.
- **Fix:** Clarify that `address` MAY be an empty string or omitted when the upstream API does not provide it; `name` and `category` remain required (or allow empty string for address).

### 4. Response Content-Type

- **Where:** api-contract
- **Issue:** All responses are JSON but Content-Type is not specified.
- **Fix:** Add that success and error responses MUST use `Content-Type: application/json`.

---

## Needs clarification

### 5. Frontend and `code` parameter

- **Where:** frontend-ui, api-contract
- **Issue:** The UI must call the same endpoint with `code=pioneerdevai`. Spec doesn't say that the frontend SHALL send the required code (e.g., hardcoded or from env). Implementer could infer it; explicit is better.
- **Suggestion:** In frontend-ui spec, add that the UI SHALL call `/api/execute` with the required `code` so that requests are authorized (implementation may hardcode or configure the value).

### 6. Ambiguous or non-restaurant user messages

- **Where:** natural-language-interpretation
- **Issue:** No scenario for "user asks for something not restaurant-related" or clearly unparseable input. LLM might still return JSON; validation might pass with generic query/near. No spec requirement to reject or handle differently.
- **Suggestion:** Either add a scenario (e.g., when the message cannot be interpreted as a restaurant search, return 422) or explicitly leave to implementation (accept that some odd inputs may produce odd but valid SearchParams).

### 7. Ordering and filtering "for relevance"

- **Where:** foursquare-integration
- **Issue:** "Orders or filters results for relevance to the user's constraints where applicable" is vague. Task says "prioritize those constraints."
- **Suggestion:** Clarify that relevance is achieved by (1) passing open_now, price, etc., to Foursquare where supported, and (2) optionally applying client-side sort/filter when needed; or state that results are returned in Foursquare order with no extra reordering.

### 8. CORS for external API consumers

- **Where:** design, api-contract
- **Issue:** "External JSON consumers" could be browser-based. CORS is not mentioned.
- **Suggestion:** In design or README, note that browser clients from other origins may require CORS; server-to-server consumers do not. No change to spec if we assume "external" means server-side unless otherwise stated.

### 9. Timeout value for upstream calls

- **Where:** design, foursquare-integration
- **Issue:** "Request times out" → 502 is specified; timeout duration is not.
- **Suggestion:** Leave as implementation detail and document the chosen timeout in README or code comments.

---

## Cross-references and consistency

- **Error bodies:** api-auth-gate, api-contract, and foursquare-integration use consistent `{ "error": "Unauthorized" }`, `{ "error": "Upstream API error" }`, and 422 shape. RestaurantFinder.md table is matched.
- **SearchParams shape:** natural-language-interpretation and RestaurantFinder.md schema align (query, near, open_now?, price?, limit?).
- **Result shape:** Foursquare and api-contract both list name, address, category, rating?, price?, open_now?, distance_meters?; RestaurantFinder.md uses `price?: number` (1–4). Specs are consistent.

---

## Summary

| Category            | Count | Action |
|---------------------|-------|--------|
| Wrong                | 0     | None   |
| Incomplete           | 4     | **Applied** (see fixes below) |
| Needs clarification  | 5     | Optional; CORS added to design |

### Applied fixes

- **api-contract:** Success with zero results (200 + `results: []`, `interpreted`); Content-Type application/json.
- **foursquare-integration:** Scenario for zero results; address optional when Foursquare does not provide it; relevance wording clarified.
- **natural-language-interpretation:** Default for omitted `limit` (e.g., 10) before calling Foursquare.
- **frontend-ui:** Scenario that UI SHALL call `/api/execute` with required `code` (may be hardcoded or configured).
- **design:** CORS note for browser vs server-to-server consumers.

---

## What's still unclear (for implementers)

These are intentional or low-impact gaps; clarify in implementation or README as needed.

### Rate limit

| Item | Unclear | Suggestion |
|------|--------|------------|
| **Client identity** | "Per client (e.g., IP or session)" — no login, so "session" means anonymous (cookie/fingerprint?) or IP only. | On Cloudflare, prefer IP-based: `CF-Connecting-IP` (fallback `X-Forwarded-For`). Document in README. |
| **Rolling vs fixed window** | "1 per 60 seconds" — rolling 60s vs calendar minute. | Use **rolling 60-second window**; document if different. |
| **Serverless / edge** | In-memory store does not span Cloudflare instances; each isolate has its own map. | Use a Cloudflare shared store (prefer **Durable Objects**) so per-client limits work across instances as best as possible; document any best-effort behavior in README. |

### API and validation

| Item | Unclear | Suggestion |
|------|--------|------------|
| **Whitespace-only message** | Contract says "missing or empty"; not explicit for whitespace-only. | **Applied:** api-contract and tasks require "missing, empty, or whitespace-only" → 400; trim before check. |
| **`query` / `near` empty** | LLM could return `""` for query or near. Foursquare may require non-empty location. | **Applied:** natural-language-interpretation requires non-empty query and near; validation fails → 422 if empty or invalid. |
| **Message max length** | GET with long message can hit URL length limits (~2K–8K). | **Applied:** Optional cap; if implemented, exceed max length → 400; document limit in README (see design + api-contract + task 10.1). |

### External services

| Item | Unclear | Suggestion |
|------|--------|------------|
| **Foursquare API base URL / version** | Not in spec. | **Applied:** Use official Place Search docs; base URL and version are in `prompts/foursquare-contract.md`; README MUST document where to find/override them (see design + task 10.1). |
| **OpenRouter model** | Which model ID to use. | **Applied:** Implementation choice; pick one that supports structured/JSON output; README MUST document the model ID used (see design + task 10.1). |
| **Upstream timeout value** | "Request times out" → 502; duration not specified. | **Applied:** Implementation choice (e.g. 10–15s); README or code MUST document the timeout value used for OpenRouter and Foursquare (see design + task 10.1). |

### 429 response

| Item | Unclear | Suggestion |
|------|--------|------------|
| **Retry-After header** | Body has `retry_after: 60`; HTTP `Retry-After: 60` header is standard for 429. | **Applied:** The 429 response MUST include a `Retry-After: 60` response header in addition to the JSON body; see api-contract and llm-rate-limit specs. |

### Design context

| Item | Unclear | Suggestion |
|------|--------|------------|
| **Design context location** | Design context is persisted for Cursor in **.cursorrules** (project root). Use the Cursor equivalent, not CLAUDE.md. | Run teach-impeccable and save output to .cursorrules (or document in .cursorrules) so Cursor uses it for frontend work. |
| **No Design Context yet** | If .cursorrules has no design context, "when that context exists" makes frontend requirement conditional. | Run teach-impeccable first (task 8.0) and write Design Context to .cursorrules; then context exists for 8.1+; no change needed. |
