## ADDED Requirements

### Requirement: Foursquare Place Search integration

The system SHALL query the Foursquare Places API (Place Search) using only validated SearchParams. The system MUST return filtered, relevant restaurant data and MUST NOT return raw or unfiltered payloads that include noisy or irrelevant fields.

#### Scenario: Successful search

- **WHEN** SearchParams are valid and Foursquare Place Search returns one or more results
- **THEN** the system returns only relevant fields per result (e.g., name, address, category, rating, price, open_now, distance_meters) and orders or filters results for relevance to the user's constraints where applicable (e.g., by passing open_now and price to the API; client-side sort/filter is optional)

#### Scenario: Successful search with zero results

- **WHEN** SearchParams are valid and Foursquare Place Search returns no results
- **THEN** the system returns an empty results set (empty array) and does not treat this as an error

#### Scenario: Foursquare API failure

- **WHEN** Foursquare returns a non-200 response or the request times out
- **THEN** the system returns HTTP 502 with a JSON body such as `{ "error": "Upstream API error" }`

#### Scenario: Result schema

- **WHEN** results are returned
- **THEN** each result SHALL include at least: name (string), category (string); and SHALL include address (string) when Foursquare provides it (otherwise address MAY be omitted or empty string). Each result MAY include rating, price (1–4), open_now, distance_meters when available. The system SHALL NOT include extraneous or premium-only fields when not available or not relevant.
