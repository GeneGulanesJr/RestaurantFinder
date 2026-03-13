## ADDED Requirements

### Requirement: Theme defined by design tokens

The application SHALL define a single theme via design tokens (colors, typography, spacing) in a single source of truth (e.g. CSS variables and Tailwind theme extension). Token values SHALL be used consistently; components SHALL NOT use hard-coded colors, font names, or spacing values that bypass the theme.

#### Scenario: Tokens are the source of truth

- **WHEN** a developer or implementer styles the login or search UI
- **THEN** background, text, border, and accent colors SHALL be taken from theme tokens (e.g. CSS variables or Tailwind theme), not from ad-hoc hex or Tailwind arbitrary values

#### Scenario: Typography uses theme

- **WHEN** text is rendered on the login or search pages
- **THEN** font family and scale SHALL come from the theme (e.g. `--font-sans`, `--font-display` or equivalent Tailwind utilities), with no one-off font stacks in components

### Requirement: Login page uses theme

The login page at `/login` SHALL use the application theme for layout, typography, color, and controls. It SHALL remain a single centered form with username, password, submit, and demo hint; only visual presentation SHALL change to match the theme.

#### Scenario: Login page reflects theme

- **WHEN** a user visits `/login`
- **THEN** the page SHALL use the theme’s background, text, and accent colors; form inputs and primary button SHALL use theme-based styles

#### Scenario: Login behavior unchanged

- **WHEN** the user submits valid or invalid credentials
- **THEN** behavior SHALL be unchanged from the current implementation (redirect on success, error message on failure); only styling SHALL differ

### Requirement: Search UI uses theme

The root route search UI (header, form, results, loading, and error states) SHALL use the application theme for layout, typography, color, and components. All interactive and static elements SHALL use token-based styles so the page is visually cohesive with the login page.

#### Scenario: Search page reflects theme

- **WHEN** an authenticated user visits the root route
- **THEN** the header, input, submit button, results cards, loading indicator, and error alert SHALL use the theme’s colors, typography, and spacing

#### Scenario: Search behavior unchanged

- **WHEN** the user submits a query or triggers logout
- **THEN** behavior SHALL be unchanged from the current implementation; only styling SHALL differ

### Requirement: Theme is modern and aligned with design context

The theme SHALL present a modern, cohesive look aligned with the project’s design context (e.g. clear typography, sufficient contrast, minimal layout in `.cursorrules`). The visual direction SHALL follow the **frontend-design** and **normalize** agent skill guidelines (e.g. no generic AI aesthetics, tinted neutrals, intentional hierarchy).

#### Scenario: Accessible contrast

- **WHEN** theme token values are chosen
- **THEN** text-on-background combinations SHALL meet sufficient contrast (e.g. WCAG AA) for readability

#### Scenario: Cohesive palette

- **WHEN** a user views both the login and search pages
- **THEN** the two pages SHALL share the same color palette, type scale, and spacing rhythm so the experience feels like one application
