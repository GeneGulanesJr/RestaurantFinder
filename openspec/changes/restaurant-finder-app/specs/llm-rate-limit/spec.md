## ADDED Requirements

### Requirement: LLM rate limit

The system SHALL allow at most 1 LLM interpretation call per 60 seconds per client, using a rolling window (not a calendar minute). When the limit is exceeded, the system MUST return HTTP 429 and MUST NOT invoke the LLM. The client MUST be identified consistently; on Cloudflare this SHOULD be IP-based using `CF-Connecting-IP` (fallback to `X-Forwarded-For` if needed). The chosen method SHALL be documented in README.

#### Scenario: First request in window

- **WHEN** the client has not made an LLM interpretation request in the last 60 seconds
- **THEN** the request proceeds to interpretation (subject to auth and message validation)

#### Scenario: Second request within same minute

- **WHEN** the client has already made 1 LLM interpretation request within the last 60 seconds and makes another request
- **THEN** the system returns HTTP 429 with a JSON body such as `{ "error": "Too many requests", "retry_after": 60 }`, MUST include a `Retry-After: 60` response header, and does not call the LLM

#### Scenario: Request after window has passed

- **WHEN** the client made an LLM interpretation request more than 60 seconds ago and makes a new request
- **THEN** the request is allowed and proceeds to interpretation
