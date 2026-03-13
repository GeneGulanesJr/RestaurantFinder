## ADDED Requirements

### Requirement: GET /api/execute endpoint contract

The system SHALL expose a single GET endpoint at `/api/execute` that accepts `message` and `code` as query parameters. The same endpoint SHALL be used by the frontend UI and by external JSON consumers. Success and error responses MUST use `Content-Type: application/json`.

#### Scenario: Success response with results

- **WHEN** the request is authorized (`code=pioneerdevai`), the message is valid, interpretation succeeds, and Foursquare returns one or more results
- **THEN** the system returns HTTP 200 with a JSON body containing at least: `results` (array of restaurant objects with name, address, category, and optional rating, price, open_now, distance_meters) and `interpreted` (the validated SearchParams used for the search)

#### Scenario: Success response with zero results

- **WHEN** the request is authorized, the message is valid, interpretation succeeds, and Foursquare returns no results
- **THEN** the system returns HTTP 200 with a JSON body containing `results` (empty array) and `interpreted` (the SearchParams used for the search)

#### Scenario: Unauthorized

- **WHEN** `code` is missing or not equal to `pioneerdevai`
- **THEN** the system returns HTTP 401 with body `{ "error": "Unauthorized" }`

#### Scenario: Missing message

- **WHEN** `message` is missing or empty and `code` is valid
- **THEN** the system returns HTTP 400 with a body such as `{ "error": "message parameter is required" }`

#### Scenario: Interpretation failure

- **WHEN** interpretation or validation of the message fails
- **THEN** the system returns HTTP 422 with an error body (e.g., `{ "error": "Could not interpret request", "detail": "..." }`)

#### Scenario: Upstream API failure

- **WHEN** Foursquare or another upstream call fails
- **THEN** the system returns HTTP 502 with body `{ "error": "Upstream API error" }`
