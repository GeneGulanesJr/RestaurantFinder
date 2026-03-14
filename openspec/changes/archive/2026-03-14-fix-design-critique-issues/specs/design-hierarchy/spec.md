# Spec: design-hierarchy

## ADDED Requirements

### Requirement: Single gradient accent bar

The application SHALL display the thin gradient accent bar (accent → accent-light → accent-2) in exactly one place: the root layout at the top of the viewport. The search section, login card, result details modal header, and search refinement modal MUST NOT include this same gradient bar.

#### Scenario: Accent bar only on layout

- **WHEN** the user views any page (home, login)
- **THEN** at most one horizontal gradient accent bar is visible at the top of the viewport (from layout)

#### Scenario: No accent bar on search section

- **WHEN** the user is on the home page
- **THEN** the search input block does not have a gradient bar along its top edge

#### Scenario: No accent bar on login card

- **WHEN** the user is on the login page
- **THEN** the login card does not have a gradient bar along its top edge

#### Scenario: No accent bar on result details modal

- **WHEN** the result details modal is open
- **THEN** the modal header does not have a gradient bar along its top edge

### Requirement: Search block is the dominant surface

The search area (input + primary CTA) SHALL be visually distinct from result cards so that the search reads as the primary block. The search block MUST use a lighter or different treatment than the result cards (e.g. border-only or lighter shadow; no full card treatment identical to result cards). Result cards SHALL retain a clear card treatment (e.g. rounded-2xl, shadow).

#### Scenario: Search and results use different treatments

- **WHEN** the user is on the home page with no results yet
- **THEN** the search block is not styled identically to the result cards (e.g. no matching rounded-2xl + shadow-card on the search container, or search uses a visibly lighter variant)

#### Scenario: Result cards remain card-style

- **WHEN** results are shown
- **THEN** each result is presented in a card with rounded corners and card-style shadow

### Requirement: Prominent primary CTA

The primary action “Find Restaurants” SHALL be the single strong accent (solid accent fill) in the search area and SHALL be sufficiently prominent so that the user can identify the main action within a few seconds. The button MUST meet existing accessibility requirements (focus, size) and SHALL be the only primary-style button in the search block.

#### Scenario: One primary CTA in search area

- **WHEN** the user is on the home page
- **THEN** there is exactly one primary-style (accent-filled) button in the search section, and it is the “Find Restaurants” (or equivalent) submit button

#### Scenario: CTA is visually prominent

- **WHEN** the user looks at the search area
- **THEN** the submit button is clearly more prominent than hint text or secondary elements in that block (e.g. via size, color, or position)
