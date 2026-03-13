# frontend-ui Specification

## Purpose
TBD - created by archiving change restaurant-finder-app. Update Purpose after archive.
## Requirements
### Requirement: Frontend UI at root route

The system SHALL provide a usable web interface at the root route (`/`) that allows the user to submit a natural language restaurant search and view results. Access to `/` SHALL be restricted to authenticated users only; unauthenticated users SHALL be redirected to `/login` (see login-page spec). The UI MUST feel intentional and easy to use. The frontend SHALL follow the project's Design Context (established via the **teach-impeccable** skill and persisted in **.cursorrules** for Cursor) for brand, aesthetic, and design principles when that context exists.

#### Scenario: Happy path

- **WHEN** the user enters a natural language request and submits
- **THEN** the UI sends the request to the API and displays returned results in a readable format (e.g., cards or list), with each result showing name, address, category, and any available rating, price, or open status

#### Scenario: Loading state

- **WHEN** the user has submitted a request and the API call is in progress
- **THEN** a loading indicator is shown and the input (and submit control) is disabled or otherwise indicates that a request is in flight

#### Scenario: Error state

- **WHEN** the API returns an error (non-2xx)
- **THEN** a human-readable error message is shown in the UI and the user can retry (e.g., by submitting again)

#### Scenario: Rate limit (429)

- **WHEN** the API returns HTTP 429 (too many requests)
- **THEN** the UI SHALL show a clear message that the user must wait (e.g., using retry_after when present) before trying again

#### Scenario: Required UI elements

- **WHEN** the authenticated user visits the root route
- **THEN** the UI SHALL include: a text input or textarea for the natural language request, a submit button, and an area for results or messages (loading/error/results). Optionally include a logout control that clears the session and redirects to `/login`.

#### Scenario: API request authorization

- **WHEN** the user submits a search
- **THEN** the UI SHALL call the same `/api/execute` endpoint with the required `code` parameter so that the request is authorized (the value may be hardcoded or configured for the UI flow)

#### Scenario: Design context (impeccable)

- **WHEN** implementing or refining the frontend UI
- **THEN** the implementer SHALL use the **teach-impeccable** skill to establish Design Context (users, brand personality, aesthetic direction, design principles) in **.cursorrules** if not already present, and SHALL apply that Design Context to all UI decisions (typography, spacing, color, tone, components)

