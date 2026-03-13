## ADDED Requirements

### Requirement: Login page and session

The system SHALL provide a login page at `/login` and SHALL allow access to the root route `/` (search UI) only after successful authentication. Authentication SHALL use fixed demo credentials: username **demo**, password **1234**. No user database or registration; validation is server-side against this single credential pair only.

#### Scenario: Login form

- **WHEN** the user visits `/login`
- **THEN** the UI SHALL display a login form with fields for username and password and a submit button

#### Scenario: Successful login

- **WHEN** the user submits username `demo` and password `1234`
- **THEN** the system validates the credentials server-side, establishes a session (e.g. signed or encrypted cookie), and redirects the user to `/`

#### Scenario: Failed login

- **WHEN** the user submits a username or password that does not match `demo` / `1234`
- **THEN** the system SHALL not establish a session and SHALL show an error message (e.g. "Invalid username or password"); the user remains on the login page and may retry

#### Scenario: Protected root route

- **WHEN** an unauthenticated user visits `/`
- **THEN** the system SHALL redirect the user to `/login` (or otherwise prevent access to the search UI until logged in)

#### Scenario: Authenticated access to root

- **WHEN** a user with a valid session visits `/`
- **THEN** the system SHALL show the restaurant search UI (per frontend-ui spec)
