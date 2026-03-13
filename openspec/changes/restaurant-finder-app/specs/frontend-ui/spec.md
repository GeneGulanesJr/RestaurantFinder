## ADDED Requirements

### Requirement: Frontend UI at root route

The system SHALL provide a usable web interface at the root route (`/`) that allows the user to submit a natural language restaurant search and view results. The UI MUST feel intentional and easy to use.

#### Scenario: Happy path

- **WHEN** the user enters a natural language request and submits
- **THEN** the UI sends the request to the API and displays returned results in a readable format (e.g., cards or list), with each result showing name, address, category, and any available rating, price, or open status

#### Scenario: Loading state

- **WHEN** the user has submitted a request and the API call is in progress
- **THEN** a loading indicator is shown and the input (and submit control) is disabled or otherwise indicates that a request is in flight

#### Scenario: Error state

- **WHEN** the API returns an error (non-2xx)
- **THEN** a human-readable error message is shown in the UI and the user can retry (e.g., by submitting again)

#### Scenario: Required UI elements

- **WHEN** the user visits the root route
- **THEN** the UI SHALL include: a text input or textarea for the natural language request, a submit button, and an area for results or messages (loading/error/results)
