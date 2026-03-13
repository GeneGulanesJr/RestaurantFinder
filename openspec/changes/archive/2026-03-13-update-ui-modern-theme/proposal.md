## Why

The Restaurant Finder UI is functional but visually minimal (default grays, single blue accent, no design system). Users and the product benefit from a modern, cohesive interface that aligns with a clear theme and feels intentional—improving perceived quality and usability without changing behavior.

## What Changes

- **Design system / theme**: Introduce a small set of design tokens (colors, typography, spacing) and apply them consistently across the app.
- **Login page**: Restyle the login page to use the new theme (typography, colors, spacing, inputs, button) while keeping the same flow and copy.
- **Search UI (root)**: Restyle the root search experience—header, form, results cards, loading and error states—to match the theme and feel modern and readable.
- **Global styles**: Add or update global CSS (e.g. `globals.css` or Tailwind config) so the theme is the single source of truth; no one-off colors or fonts in components.
- **Optional**: Light/dark mode support only if it fits the chosen theme and scope.

## Capabilities

### New Capabilities

- `ui-theme`: Design tokens and theme (colors, typography, spacing) applied consistently across login and search UI; modern, cohesive look that aligns with project design context.

### Modified Capabilities

- None. Frontend behavior (auth, search, results, errors, rate limit) is unchanged; only visual presentation and consistency are updated.

## Impact

- **Code**: `app/globals.css`, `tailwind.config.*`, `app/layout.tsx`, `app/login/page.tsx`, `app/page.tsx`, `app/components/SearchUI.tsx`; possible new shared UI components or design-token imports.
- **Dependencies**: None required; Tailwind and existing stack are sufficient. Optional: a well-chosen font (e.g. Google Fonts) if not using system fonts.
- **Design context**: Implementation will follow the **frontend-design** and **normalize** agent skills and existing Design Context in `.cursorrules` (clear typography, contrast, minimal layout) while modernizing the theme.
