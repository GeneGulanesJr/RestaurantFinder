# natural-language-interpretation Specification

## Purpose
TBD - created by archiving change restaurant-finder-app. Update Purpose after archive.
## Requirements
### Requirement: Natural language interpretation

The system SHALL convert a free-form user message into a validated structured search parameter object (SearchParams) before any downstream API call. The system MUST use a schema (e.g., Zod) to validate the interpretation result and MUST NOT call Foursquare with unvalidated or malformed data. All calls to OpenRouter SHALL use a dedicated **system prompt** that defines what the system sends and what it expects (JSON only); the response MUST be parsed as JSON and validated against the SearchParams schema before use.

### Requirement: OpenRouter system prompt and JSON validation

The system SHALL maintain a separate OpenRouter **system prompt** (e.g., in code or a prompts file) that specifies: (1) what to send — the user message and the instruction that the model MUST respond with valid JSON only; (2) what to expect — the exact JSON shape (SearchParams) the response must match. The system MUST parse the raw API response as JSON (fail with 422 if not parseable) and MUST validate the parsed object with the SearchParams Zod schema before any downstream use.

#### Scenario: Well-formed message

- **WHEN** the user message is well-formed (e.g., "Find me cheap sushi in downtown LA that is open now") and the interpreter returns valid structured JSON
- **THEN** the system validates it against the SearchParams schema and proceeds to Foursquare only if validation passes

#### Scenario: Malformed or invalid interpreter output

- **WHEN** the interpreter returns invalid, unparseable, or schema-invalid JSON
- **THEN** the system returns HTTP 422 with a JSON body containing an error (e.g., `{ "error": "Could not interpret request", "detail": "..." }`) and MUST NOT call Foursquare

#### Scenario: JSON parse and schema validation

- **WHEN** the OpenRouter API returns a response
- **THEN** the system MUST first parse the response body as JSON; if parsing fails, the system SHALL treat it as interpretation failure and return 422
- **AND** the system MUST validate the parsed object against the SearchParams Zod schema; if validation fails, the system SHALL return 422 and MUST NOT call Foursquare

#### Scenario: SearchParams shape

- **WHEN** interpretation succeeds
- **THEN** the validated object SHALL include at least: `query` (non-empty string), `near` (non-empty string), and optionally `open_now` (boolean), `price` ("1"|"2"|"3"|"4"), `limit` (number). When `limit` is omitted, the system SHALL use a default of 10 before calling Foursquare. If `query` or `near` is empty or invalid, validation SHALL fail and the system SHALL return 422.

#### Scenario: Message not interpretable as restaurant search

- **WHEN** the user message cannot be interpreted as a restaurant search (e.g., non-restaurant request, gibberish, or the interpreter explicitly indicates uninterpretable)
- **THEN** the system returns HTTP 422 with a JSON body containing an error (e.g., `{ "error": "Could not interpret request", "detail": "..." }`) and MUST NOT call Foursquare

