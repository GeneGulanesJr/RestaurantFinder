## Context

The app is a Next.js Restaurant Finder with Tailwind. Current UI uses default grays, a single blue accent, and minimal layout (`.cursorrules`: "clear typography, sufficient contrast, and minimal layout"). Pages: login (`/login`) and protected search at `/` with `SearchUI`. There is no shared design system or tokens yet; colors and spacing are hard-coded in components. This change introduces a small theme and applies it consistently using the **frontend-design** and **normalize** agent skills so the UI feels modern and on-brand without changing behavior.

## Goals / Non-Goals

**Goals:**

- Define a single theme (design tokens) and use it everywhere so the UI is cohesive and maintainable.
- Modernize the look: typography, color palette, and spacing that feel intentional and aligned with a "refined minimal, warm" direction suitable for a restaurant-finding product.
- Apply the theme to login and search UI (form controls, buttons, cards, alerts) so both pages share the same visual language.
- Keep implementation simple: CSS variables + Tailwind config extension; no new UI library or design-token runtime.

**Non-Goals:**

- Changing any user flows, API contracts, or accessibility requirements already met.
- Full design-system documentation or component library beyond what’s needed for this app.
- Dark mode unless it is a trivial addition (e.g. one palette swap) and fits the chosen direction.

## Decisions

- **Aesthetic direction — refined minimal with warmth**: The interface should feel clear and trustworthy (minimal) but approachable (warm), fitting "find a place to eat." Avoid generic AI aesthetics: no Inter/Roboto, no cyan-on-dark, no pure black/white, no gradient text or hero-metric layouts. Use a distinctive body font (and optional display font for headings), neutrals tinted toward the brand hue, and a single accent (e.g. warm amber or soft green) for primary actions. Typography and spacing create hierarchy; avoid wrapping everything in identical cards.

- **Tokens in CSS variables + Tailwind**: Define a small set of tokens in `app/globals.css` (e.g. `--color-surface`, `--color-text`, `--color-accent`, `--font-sans`, `--font-display`, `--space-*`) and map them in `tailwind.config.*` via `theme.extend` so components use utility classes (e.g. `bg-surface`, `text-fg`, `font-sans`) instead of hard-coded values. This keeps one source of truth and makes future theme tweaks (or optional dark mode) straightforward.

- **Typography**: Use a modular scale and fluid sizing where helpful. Choose a readable, distinctive body font and, if desired, a display font for the app title. Avoid overused system/default stacks; prefer a single well-chosen web font (e.g. Google Fonts) loaded in `layout.tsx` and assigned to CSS variables. No monospace for "technical" feel.

- **Color**: One dominant background tint, tinted neutrals for text and borders (no pure #000/#fff), and one accent for primary buttons and key interactive elements. Prefer modern CSS (e.g. `oklch` or `color-mix`) in the variable definitions for consistency. Error and alert states use a clear semantic color derived from the palette, not a random red.

- **Spacing and layout**: Use spacing tokens (e.g. `--space-2` … `--space-8`) and apply them for padding, gaps, and margins so rhythm is consistent. Allow asymmetric or purposeful layouts (e.g. header vs. content) rather than centering everything. No nested cards; flatten hierarchy where possible.

- **Components**: No new component library. Restyle existing `login/page.tsx` and `SearchUI` (and root `page.tsx`/`layout.tsx` if needed) to use the new tokens via Tailwind classes. Shared patterns (e.g. primary button, input, card, alert) are implemented by applying the same token-based classes in both places so the app normalizes to one design system.

- **Motion**: Optional; if added, use for state change (e.g. loading, error reveal) with restrained easing (e.g. ease-out). No bounce/elastic; no animating width/height—prefer transform/opacity or grid-template-rows.

## Risks / Trade-offs

- **Font loading**: Adding a web font can cause a brief layout or flash. Mitigation: load font in layout with `display=swap` or similar and use fallback stack; keep payload small (one or two weights).
- **Token sprawl**: Too many variables become hard to maintain. Mitigation: start with a minimal set (background, text, border, accent, 2–3 spacing steps, 2 font families); expand only when needed.
- **Contrast**: Tinted neutrals must still meet contrast requirements. Mitigation: test text/background pairs (e.g. WCAG AA) when defining token values.

## Migration Plan

No data or API migration. Deploy is a frontend-only change: ship updated CSS and components; no feature flags required. Rollback: revert to previous CSS and component markup if needed.

## Open Questions

- Exact font choices (body and optional display) can be decided at implementation time from the frontend-design guidelines.
- Whether to add a minimal dark mode (e.g. `prefers-color-scheme` + second set of variables) can be decided after the light theme is in place and stable.
