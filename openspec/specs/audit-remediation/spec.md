# Audit remediation

Spec for accessibility, motion, theming, and code-quality fixes driven by `docs/audit-report.md`.

## ADDED Requirements

### Requirement: Search input has an associated label

The main search text input SHALL have an associated visible or programmatically linked label so assistive technologies can announce its purpose (WCAG 3.3.2).

#### Scenario: Label is present and associated

- **WHEN** the search form is rendered
- **THEN** an element with a label role or a `<label>` with `htmlFor` matching the input’s `id` ("search-message") exists, and the input’s purpose is clear to screen reader users

### Requirement: Minimum touch target size for primary controls

Interactive elements that are the primary way to complete a task (modal close, refinement filters and actions, sign out) SHALL have a minimum touch target size of 44×44 CSS pixels.

#### Scenario: ResultDetailsModal close button size

- **WHEN** the result details modal is open
- **THEN** the close button has a hit area of at least 44×44px (e.g. min-height and min-width or equivalent padding)

#### Scenario: SearchRefinementModal interactive elements

- **WHEN** the search refinement modal is open
- **THEN** each template button, filter chip, and footer button (Cancel, Show results, Skip) has a touch target of at least 44×44px

#### Scenario: Sign out button size

- **WHEN** the main search UI header is rendered
- **THEN** the Sign out button has a touch target of at least 44×44px

### Requirement: Decorative icons are hidden from assistive technologies

SVG icons that are purely decorative (redundant with adjacent text) SHALL have `aria-hidden="true"` so they are not announced by screen readers.

#### Scenario: Decorative SVGs in SearchUI

- **WHEN** SearchUI renders (search icon, location, star, clock, dollar, utensils, map pin, chevron)
- **THEN** each such icon that is decorative has `aria-hidden="true"` on the SVG (or on a wrapping span that contains only the icon)

#### Scenario: Decorative SVGs in ResultDetailsModal and SearchRefinementModal

- **WHEN** ResultDetailsModal or SearchRefinementModal renders icons
- **THEN** decorative icons have `aria-hidden="true"`; icon-only buttons (e.g. close) retain `aria-label` on the button

### Requirement: Login error is announced to screen readers

When the login form displays an error message, that message SHALL be exposed as a live region (e.g. `role="alert"`) so it is announced by screen readers.

#### Scenario: Error container has alert role

- **WHEN** the login page shows an error (invalid credentials, network error)
- **THEN** the error message container has `role="alert"` (or an equivalent live region)

### Requirement: Entrance animation uses smooth ease-out only

The `rf-enter` entrance animation SHALL not use bounce or elastic-style overshoot; it SHALL use a monotonic ease-out (e.g. opacity and translateY/scale from initial to final only).

#### Scenario: No overshoot in rf-enter

- **WHEN** elements with the `rf-enter` animation are rendered
- **THEN** the keyframes do not include an intermediate keyframe that overshoots the final position (e.g. no translateY(-2px) or scale(1.01) before settling at 0 and 1)

### Requirement: Star rating color uses design token

Star rating indicators SHALL use a theme token (e.g. `--rf-rating`) for their color, not a hard-coded Tailwind color (e.g. `text-amber-500`).

#### Scenario: Rating color from token

- **WHEN** a star rating is displayed (SearchUI result cards, ResultDetailsModal)
- **THEN** the star icon or rating text uses a class/token derived from `--rf-rating` (or equivalent) in CSS/Tailwind

### Requirement: Result list uses stable keys

The list of search result cards SHALL be keyed by a stable value per item (e.g. name + address or a unique id), not by array index.

#### Scenario: Keys are stable

- **WHEN** search results are rendered in the results grid
- **THEN** each result card’s `key` prop is derived from item identity (e.g. `name` + `address`), not from the loop index

### Requirement: No dead code for reduced motion in SearchUI

SearchUI SHALL NOT define an unused `usePrefersReducedMotion` hook when reduced motion is already handled by CSS media queries. If the hook is kept, it SHALL be used to conditionally suppress or shorten JS-driven animations.

#### Scenario: No unused reduced-motion hook

- **WHEN** SearchUI is implemented after this change
- **THEN** either `usePrefersReducedMotion` is removed, or it is used to control some JS-driven animation behavior

### Requirement: Unused gradient and glass utilities removed

The global styles SHALL NOT define `.rf-gradient-text` or `.rf-glass` if they are unused, to avoid future misuse and reduce CSS surface area.

#### Scenario: Utilities absent when unused

- **WHEN** the app’s global CSS is loaded
- **THEN** there are no definitions for `.rf-gradient-text` or `.rf-glass` unless they are referenced elsewhere in the codebase
