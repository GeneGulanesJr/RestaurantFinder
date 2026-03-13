# foursquare-integration Specification

## Purpose
TBD - created by archiving change restaurant-finder-app. Update Purpose after archive.
## Requirements
### Requirement: Foursquare Place Search integration

The system SHALL query the Foursquare Places API (Place Search) using only validated SearchParams. The system MUST return filtered, relevant restaurant data and MUST NOT return raw or unfiltered payloads that include noisy or irrelevant fields. The system SHALL maintain a **Foursquare request/response contract** (what we send, what we expect in JSON) and SHALL validate the Foursquare API response as JSON against a schema before mapping to the internal result shape.

### Requirement: Foursquare JSON validation and contract

The system SHALL document and implement: (1) **What we send** — the Place Search request (method, URL, query params, headers) in a single contract/prompt-like reference; (2) **What we expect** — the expected JSON response shape (e.g., raw Foursquare response schema or a minimal schema for the fields we use). The system MUST parse the response body as JSON (treat non-JSON or parse failure as upstream error, 502) and MUST validate the parsed response (e.g., with Zod) against the expected shape before mapping to the internal restaurant result schema; invalid or unexpected structure SHALL be treated as upstream error (502).

#### Scenario: Successful search

- **WHEN** SearchParams are valid and Foursquare Place Search returns one or more results
- **THEN** the system returns only relevant fields per result (e.g., name, address, category, rating, price, open_now, distance_meters) and orders or filters results for relevance to the user's constraints where applicable (e.g., by passing open_now and price to the API; client-side sort/filter is optional)

#### Scenario: Successful search with zero results

- **WHEN** SearchParams are valid and Foursquare Place Search returns no results
- **THEN** the system returns an empty results set (empty array) and does not treat this as an error

#### Scenario: Foursquare API failure

- **WHEN** Foursquare returns a non-200 response or the request times out
- **THEN** the system returns HTTP 502 with a JSON body such as `{ "error": "Upstream API error" }`

#### Scenario: Foursquare response JSON validation

- **WHEN** Foursquare returns a 200 response
- **THEN** the system MUST parse the response body as JSON; if parsing fails, the system SHALL return 502 with `{ "error": "Upstream API error" }`
- **AND** the system MUST validate the parsed JSON against the expected Foursquare response schema; if validation fails, the system SHALL return 502 and MUST NOT return partial or unvalidated data to the client

#### Scenario: Result schema

- **WHEN** results are returned
- **THEN** each result SHALL include at least: name (string), category (string); and SHALL include address (string) when Foursquare provides it (otherwise address MAY be omitted or empty string). Each result MAY include rating, price (1–4), open_now, distance_meters when available. The system SHALL NOT include extraneous or premium-only fields when not available or not relevant.

