## Why

A full interface quality audit (see `docs/audit-report.md`) identified 24 issues across accessibility, performance, theming, and anti-patterns. Two critical and six high-severity items should be fixed so the app meets WCAG expectations, has adequate touch targets, and aligns with the project’s frontend-design guidelines. Fixing these now improves usability, accessibility, and maintainability before they become technical debt.

## What Changes

- **Accessibility**
  - Add an associated label for the main search input (WCAG 3.3.2).
  - Increase touch targets to at least 44×44px for: ResultDetailsModal close button, SearchRefinementModal filter/footer buttons, Sign out button.
  - Add `aria-hidden="true"` to decorative SVG icons; keep or add `aria-label` where icons convey meaning.
  - Add `role="alert"` to the login page error container.
  - Optionally migrate ResultDetailsModal to `<dialog>` with proper semantics and inert for robustness.
- **Motion**
  - Remove bounce-like overshoot from `rf-enter` keyframes in `globals.css`; use smooth ease-out only.
- **Theming**
  - Replace hard-coded `text-amber-500` for star ratings with a design token (e.g. `--rf-rating`).
  - Optionally add `prefers-color-scheme: dark` support or document light-only; if deferred, no code change in this change.
- **Code quality**
  - Remove unused `usePrefersReducedMotion` hook from SearchUI or use it for JS-driven motion.
  - Use stable keys for result list items (e.g. `name` + `address`) instead of array index.
- **Anti-patterns / optional**
  - Remove unused `.rf-gradient-text` and `.rf-glass` utilities from `globals.css` to avoid future misuse.

No new user-facing features. No breaking API or route changes.

## Capabilities

### New Capabilities

- `audit-remediation`: Accessibility (labels, touch targets, ARIA, optional dialog), motion (entrance easing), theming (rating token), and code-quality fixes (keys, dead code, unused CSS) as specified in the audit report.

### Modified Capabilities

- None. Existing specs (frontend-ui, search-result-details-modal, guided-search-refinement, login-page) are not changing requirement text; this change implements quality and compliance improvements within current behavior.

## Impact

- **Affected code:** `app/components/SearchUI.tsx`, `app/components/ResultDetailsModal.tsx`, `app/components/SearchRefinementModal.tsx`, `app/login/page.tsx`, `app/globals.css`, `tailwind.config.ts`.
- **Dependencies:** None.
- **Systems:** Frontend only; no API or backend changes.
