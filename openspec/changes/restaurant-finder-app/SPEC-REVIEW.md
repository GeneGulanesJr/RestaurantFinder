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
