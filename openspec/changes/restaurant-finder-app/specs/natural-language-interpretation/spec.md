## ADDED Requirements

### Requirement: Natural language interpretation

The system SHALL convert a free-form user message into a validated structured search parameter object (SearchParams) before any downstream API call. The system MUST use a schema (e.g., Zod) to validate the interpretation result and MUST NOT call Foursquare with unvalidated or malformed data.

#### Scenario: Well-formed message

- **WHEN** the user message is well-formed (e.g., "Find me cheap sushi in downtown LA that is open now") and the interpreter returns valid structured JSON
- **THEN** the system validates it against the SearchParams schema and proceeds to Foursquare only if validation passes

#### Scenario: Malformed or invalid interpreter output

- **WHEN** the interpreter returns invalid, unparseable, or schema-invalid JSON
- **THEN** the system returns HTTP 422 with a JSON body containing an error (e.g., `{ "error": "Could not interpret request", "detail": "..." }`) and MUST NOT call Foursquare

#### Scenario: SearchParams shape

- **WHEN** interpretation succeeds
- **THEN** the validated object SHALL include at least: `query` (string), `near` (string), and optionally `open_now` (boolean), `price` ("1"|"2"|"3"|"4"), `limit` (number). When `limit` is omitted, the system SHALL use a default of 10 before calling Foursquare.

#### Scenario: Message not interpretable as restaurant search

- **WHEN** the user message cannot be interpreted as a restaurant search (e.g., non-restaurant request, gibberish, or the interpreter explicitly indicates uninterpretable)
- **THEN** the system returns HTTP 422 with a JSON body containing an error (e.g., `{ "error": "Could not interpret request", "detail": "..." }`) and MUST NOT call Foursquare
