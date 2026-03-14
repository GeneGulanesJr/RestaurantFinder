# Fix Design Critique Issues

## Why

The app received a design-director-style critique that identified several "AI slop" tells and flattened hierarchy: the same gradient accent bar is repeated on every surface, the search and results both use the same card treatment so the primary action doesn't stand out, and motion uses a slight bounce/overshoot that conflicts with frontend-design guidance. Fixing these will make the UI feel more intentional and designed rather than template-generated, without changing behavior or features.

## What Changes

- **Gradient accent bar**: Use the top accent bar in one place only (e.g. root layout) and remove or replace it on the search section, login card, and result details modal so the pattern isn’t repeated everywhere.
- **Visual hierarchy**: Differentiate the search area from result cards so the search is the dominant block (e.g. search without full card treatment or with a lighter treatment; reserve “card” for results). Make the primary CTA (“Find Restaurants”) more prominent so it’s the obvious next step.
- **Motion**: Remove overshoot from entrance/easing (use monotonic ease-out; no bounce).
- **Optional / follow-up**: Consider replacing one modal (refinement or result details) with an inline or panel pattern to reduce “modals everywhere”; this is scoped as design exploration in design.md, not a requirement in this change.

No new features; no breaking API or auth changes. Purely visual and motion polish.

## Capabilities

### New Capabilities

- **design-hierarchy**: Single accent bar usage, clearer search-vs-results hierarchy, and a more prominent primary CTA so the interface reads as “search first” and doesn’t feel like “cards everywhere.”
- **motion-easing**: Entrance and feedback motion use smooth deceleration only (no overshoot/bounce) and align with frontend-design motion guidance.

### Modified Capabilities

- None. Existing specs (frontend-ui, search-results-list, search-result-details-modal, guided-search-refinement, login-page) are unchanged at the requirement level; this change is implementation and design polish only.

## Impact

- **Affected code**: `app/layout.tsx`, `app/globals.css`, `app/components/SearchUI.tsx`, `app/login/page.tsx`, `app/components/ResultDetailsModal.tsx`. Optionally `SearchRefinementModal.tsx` if accent is removed there.
- **Dependencies**: None.
- **Systems**: None; client-side UI and CSS only.
