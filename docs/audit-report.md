# Restaurant Finder — Interface Quality Audit Report

**Date:** 2026-03-14  
**Scope:** `app/` (layout, pages, components), `app/globals.css`, `tailwind.config.ts`  
**Reference:** frontend-design skill (anti-patterns, DO/DON'T), WCAG 2.x, responsive and performance best practices.

---

## Anti-Patterns Verdict

**Verdict: Partial pass — some AI-slop tells, but not the worst.**

The UI avoids the most obvious AI clichés (no cyan-on-dark, no purple-to-blue gradients, no Inter/Roboto). It uses a committed warm terracotta palette and design tokens. However, several patterns from the frontend-design skill’s “DON’T” list are present:

| Tell | Location | Notes |
|------|----------|--------|
| **Gradient accent bar** | `layout.tsx`, `SearchUI.tsx`, `login/page.tsx`, `ResultDetailsModal.tsx` | Repeated “thick colored bar on one side” (gradient top bar). Skill: “rounded elements with thick colored border on one side—a lazy accent.” |
| **Bounce-like easing** | `globals.css` `rf-enter` keyframes (60% overshoot: `translateY(-2px) scale(1.01)`) | Skill: “DON’T use bounce or elastic easing—they feel dated and tacky.” |
| **Cards everywhere** | Search results grid, search section, login card, modals | Skill: “DON’T wrap everything in cards” and “identical card grids—same-sized cards with icon + heading + text.” |
| **Modals as default** | `ResultDetailsModal`, `SearchRefinementModal` | Skill: “DON’T use modals unless there’s truly no better alternative—modals are lazy.” |
| **Generic card treatment** | Rounded-2xl + shadow-card on most surfaces | Skill: “rounded rectangles with generic drop shadows—safe, forgettable.” |
| **Utility exists: gradient text** | `globals.css` `.rf-gradient-text` | Skill: “DON’T use gradient text for impact.” Not used in current UI but present. |
| **Utility exists: glass** | `globals.css` `.rf-glass` | Skill: “DON’T use glassmorphism everywhere.” Not used in current UI but present. |
| **Hero-style header** | SearchUI: logo + “Restaurant Finder” + “Discover your next favorite dining spot” | Echoes “big number, small label” hero pattern; not a metric but same structure. |
| **Centered login** | `login/page.tsx`: full-screen center layout | Skill: “DON’T center everything.” |

**Positive:** Distinct palette (warm/terracotta), design tokens (oklch), non-generic fonts (Outfit, Playfair Display), and no neon-on-dark or cyan/purple gradient clichés.

---

## Executive Summary

- **Total issues:** 24 (Critical: 2, High: 6, Medium: 9, Low: 7)
- **Top priorities:** (1) Add visible label for search input (WCAG A). (2) Increase touch targets to ≥44px where interactive. (3) Replace bounce-like entrance with non-elastic easing. (4) Add dark mode or document intentional light-only. (5) Remove or gate gradient/glass utilities and trim card/modals where alternatives exist.
- **Overall:** The app is usable and theming is largely token-based. The main gaps are accessibility (one critical form label, several small touch targets), a few anti-patterns (gradient bar, bounce, overuse of cards/modals), and theming (hard-coded amber, no dark mode). Addressing the critical and high items will materially improve quality.

---

## Detailed Findings by Severity

### Critical Issues

| # | Location | Category | Description | Impact | WCAG/Standard | Recommendation | Suggested command |
|---|----------|----------|-------------|--------|----------------|----------------|-------------------|
| 1 | `SearchUI.tsx` — search input | Accessibility | Input has `id="search-message"` but no associated `<label htmlFor="search-message">`. Only placeholder and hint text. | Screen readers may not announce the purpose; fails WCAG 3.3.2 Labels or Instructions (A). | WCAG 2.2 Level A | Add a visible or visually hidden label (e.g. “Search” or “What are you craving?”) associated via `htmlFor`. | `/harden` or manual fix |
| 2 | `ResultDetailsModal.tsx` L141 — close button | Accessibility / Responsive | Close button is `h-9 w-9` (36×36px). | Below 44×44px minimum touch target; harder to tap on touch devices and for users with motor limitations. | WCAG 2.5.5 Target Size (Level AAA); common 44px guideline | Use at least 44×44px (e.g. min-h-[44px] min-w-[44px] or equivalent padding). | `/adapt` |

### High-Severity Issues

| # | Location | Category | Description | Impact | WCAG/Standard | Recommendation | Suggested command |
|---|----------|----------|-------------|--------|----------------|----------------|-------------------|
| 3 | `SearchRefinementModal.tsx` — filter and action buttons | Responsive / Accessibility | Many buttons use `px-3 py-1` or `py-1.5` (e.g. Cuisine, Price, Distance, Rating, Open now, Cancel, “Show results”). | Touch targets likely under 44px height; poor usability on mobile and for accessibility. | WCAG 2.5.5 (AAA), 44px convention | Increase padding or min-height so interactive height ≥44px (e.g. py-2.5 or min-h-[44px]). | `/adapt` |
| 4 | `globals.css` — `rf-enter` keyframes | Anti-pattern / Motion | At 60%, keyframe uses `translateY(-2px) scale(1.01)` (overshoot). | Reads as bounce/elastic; conflicts with “smooth deceleration” guidance. | frontend-design skill | Remove overshoot; use monotonic ease-out (e.g. translateY only, or scale 0.98→1). | `/animate` or `/quieter` |
| 5 | `globals.css`, `tailwind.config.ts` | Theming | No dark mode. `color-scheme: light` only; no `prefers-color-scheme: dark` or dark theme variables. | Users in low light or preferring dark get no support; can affect readability and comfort. | Best practice / inclusivity | Add dark theme (e.g. media-based or toggle) and dark variants for tokens, or document intentional light-only. | `/normalize` or design decision |
| 6 | `SearchUI.tsx` L144, `ResultDetailsModal.tsx` L170 | Theming | Star rating uses `text-amber-500` (Tailwind fixed color). | Not from design tokens; may clash if palette changes and breaks theme consistency. | Theming consistency | Use a token (e.g. rating/success or a dedicated `--rf-rating`) and reference it. | `/normalize` |
| 7 | `ResultDetailsModal.tsx` — overlay | Accessibility | Backdrop is a `<div>` with `onClick={onClose}`. Focus is trapped and returned correctly, but dialog is not implemented with `<dialog>` or `inert` on backdrop. | Slightly higher risk of focus or modal semantics being missed by AT; Escape/click-outside already handled. | ARIA / HTML5 dialog | Prefer `<dialog>` with `showModal()` and `inert` on document body, or ensure ARIA + focus trap are complete and tested with AT. | `/harden` |
| 8 | Decorative SVGs (SearchUI, ResultDetailsModal, login, SearchRefinementModal) | Accessibility | Inline SVG icons (Search, Location, Star, etc.) have no `aria-hidden="true"` or `role="img"` with `aria-label`. | When redundant with visible text, they can be announced by screen readers and add noise. | WCAG 1.1.1, 4.1.2 | For decorative icons, add `aria-hidden="true"`. For standalone meaning, use `role="img"` and `aria-label`. | `/harden` |

### Medium-Severity Issues

| # | Location | Category | Description | Impact | WCAG/Standard | Recommendation | Suggested command |
|---|----------|----------|-------------|--------|----------------|----------------|-------------------|
| 9 | `SearchRefinementModal.tsx` L201–202 | Performance | Progress bar uses `transition-[width]` and `style={{ width: \`${progressPercent}%\` }}`. | Animating `width` causes layout; transform-based (e.g. scaleX) is cheaper. | Performance best practice | Use transform: scaleX(progressPercent/100) on a fixed-width bar, or accept minor layout cost. | `/optimize` |
| 10 | `SearchUI.tsx` — `usePrefersReducedMotion` | Performance / Code quality | Hook is defined and never called. | Dead code; no runtime impact. CSS `prefers-reduced-motion` already shortens durations. | — | Remove hook or use it to conditionally skip JS-driven animations. | Manual cleanup |
| 11 | `tailwind.config.ts` — boxShadow | Theming | `soft`, `card`, `hover` use `rgba(0,0,0,...)`. | Hard-coded black; won’t adapt if a dark theme is added. | Theming | Prefer tokens (e.g. `oklch(var(--rf-shadow) / 0.15)`) or theme-aware shadows. | `/normalize` |
| 12 | Repeated gradient accent bar | Anti-pattern | Same “gradient bar” pattern in layout, SearchUI search section, login card, ResultDetailsModal, SearchRefinementModal (conceptually). | Visual repetition and “lazy accent” feel. | frontend-design skill | Use once (e.g. only layout) or replace with a more intentional accent (e.g. subtle border, typography). | `/distill` or `/quieter` |
| 13 | Result cards + modal | Anti-pattern | Results are cards; click opens a modal for details. | “Modals are lazy”; could use inline expand, drawer, or navigation instead. | frontend-design skill | Consider inline expansion, side panel, or detail route instead of modal. | Design / `/distill` |
| 14 | `ResultDetailsModal.tsx` — backdrop click | Interaction | Clicking overlay closes modal. | Common but can cause accidental closes; no confirmation. | UX | Accept as-is or add “Click outside to close” hint; ensure focus trap is robust. | Optional `/clarify` |
| 15 | Login error | Accessibility | Error text only; no `role="alert"` or live region. | Screen reader may not announce dynamic error. | WCAG 4.1.3 (AA) | Add `role="alert"` to the error container (like SearchUI error block). | `/harden` |
| 16 | Search result cards — `key={i}` | Performance / Correctness | `results.map((r, i) => ... key={i})`. | Index as key can cause unnecessary re-renders or bugs if list order changes. | React best practice | Use stable id (e.g. `r.name` + `r.address` or API id) for `key`. | `/optimize` |
| 17 | Heading hierarchy | Accessibility | Main content has `h1` in header; results use `h2`; modal uses `h2` for title. | When modal is open, two `h2`s (page + modal) may confuse outline. | WCAG 1.3.1, 2.4.6 | Keep one logical document outline; e.g. modal could use `h2` with a single `h1` on page. | `/harden` |

### Low-Severity Issues

| # | Location | Category | Description | Impact | Recommendation | Suggested command |
|---|----------|----------|-------------|--------|----------------|-------------------|
| 18 | `globals.css` — `.rf-gradient-text`, `.rf-glass` | Anti-pattern | Utilities defined but unused. | Risk of future misuse (gradient text, glassmorphism). | Remove or restrict to specific components. | `/distill` |
| 19 | Login page copy | UX | “Enter any username and password to explore” at bottom. | Slightly redundant with “Sign in to discover…”; minimal. | Shorten or remove if not needed for demos. | `/clarify` |
| 20 | Scrollbar styling | Theming | Only WebKit scrollbars styled; Firefox uses default. | Inconsistent look in Firefox. | Add `scrollbar-color` / `scrollbar-width` for Firefox or leave as-is. | Optional `/normalize` |
| 21 | No container queries | Responsive | Layout uses viewport breakpoints only. | Component-level responsiveness could be improved. | Consider `@container` for cards or search section. | `/adapt` |
| 22 | LoadingSpinner SVG | Accessibility | Decorative spinner has no `aria-hidden` or `role="status"` + `aria-live`. | Minor: loading state may be announced only via button text. | Add `aria-hidden="true"` on decorative spinner or `aria-live="polite"` on status text. | `/harden` |
| 23 | Sign out button | Responsive | `px-3 py-2` may be under 44px on one axis. | Touch target could be slightly small. | Ensure min 44px touch target. | `/adapt` |
| 24 | Hover-only “Why” / chevron on cards | Accessibility / Responsive | “Why” text and chevron visible on hover; card is focusable. | Keyboard users may not see hover state; focus ring helps but “Why” could be always visible. | Ensure focus ring is clear; consider showing “Why” on focus or always. | `/harden` or `/adapt` |

---

## Patterns & Systemic Issues

- **Touch targets:** Multiple interactive elements (modal close, refinement filter buttons, Sign out, card actions) are below 44×44px. Fix systematically in `SearchRefinementModal`, `ResultDetailsModal`, and header.
- **Form labels:** Search input is the only unlabeled control; login form has proper labels. One fix (search label) resolves the critical gap.
- **Design tokens:** Overall good use of `--rf-*` in CSS and Tailwind. Exceptions: `text-amber-500`, `rgba` in boxShadow, and no dark tokens.
- **Anti-patterns:** Gradient accent bar repeated in 4+ places; entrance animation has bounce-like overshoot; cards and modals used heavily. Addressing these will reduce “template” feel.
- **Motion:** Reduced motion is respected via CSS; no need for the unused `usePrefersReducedMotion` unless JS-driven motion is added.

---

## Positive Findings

- **Palette and tokens:** Warm terracotta/cream palette and oklch tokens are consistent and maintainable; no pure #000/#fff.
- **Focus and keyboard:** `.rf-focus` and `focus-visible:rf-focus` are applied on interactive elements; modals implement focus trap and Escape; tab order is logical.
- **Modals:** Both modals use `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`; ResultDetailsModal close has `aria-label="Close details"`.
- **Error and alerts:** SearchUI error block has `role="alert"`.
- **Images:** Result details photos use descriptive `alt` and `loading="lazy"`.
- **Motion:** Keyframes use transform/opacity (no layout thrashing); reduced-motion media query shortens durations.
- **Typography:** Outfit + Playfair Display with CSS variables; no Inter/Roboto.
- **Sections:** SearchRefinementModal and ResultDetailsModal use `aria-label` on sections (Quick templates, Filters, Location, etc.).

---

## Recommendations by Priority

1. **Immediate (critical)**  
   - Add an associated visible or visually hidden label for the search input.  
   - Increase ResultDetailsModal close button to at least 44×44px.

2. **Short-term (high)**  
   - Increase touch targets in SearchRefinementModal (filter and footer buttons) and Sign out to ≥44px.  
   - Remove bounce-like overshoot from `rf-enter` in `globals.css`.  
   - Decide on dark mode: add it or document light-only.  
   - Replace `text-amber-500` with a design token for rating.  
   - Consider `<dialog>` or full ARIA/inert for ResultDetailsModal.  
   - Mark decorative SVGs with `aria-hidden="true"` (and use `role="img"` + `aria-label` where they convey meaning).

3. **Medium-term (quality)**  
   - Progress bar: animate with transform instead of width.  
   - Remove or use `usePrefersReducedMotion`.  
   - Tokenize box shadows and add dark theme if applicable.  
   - Reduce or vary gradient accent bar; consider one global accent.  
   - Consider alternatives to modals (inline expand, drawer, route).  
   - Add `role="alert"` to login error block.  
   - Use stable keys for result list (not index).  
   - Refine heading hierarchy when modal is open.

4. **Long-term (nice-to-have)**  
   - Remove or restrict `.rf-gradient-text` and `.rf-glass`.  
   - Trim redundant copy on login.  
   - Optional: Firefox scrollbar theming, container queries, clearer loading/status semantics for spinner.

---

## Suggested Commands for Fixes

| Goal | Command | Issues addressed |
|------|---------|-------------------|
| Form label, error semantics, modal semantics, SVG roles, key stability | `/harden` | #1, #7, #8, #15, #16, #22, #24 |
| Touch targets, container queries | `/adapt` | #2, #3, #21, #23 |
| Bounce removal, gradient bar reduction | `/animate`, `/quieter` | #4, #12 |
| Dark mode, tokens (amber, shadow), scrollbar | `/normalize` | #5, #6, #11, #20 |
| Progress bar animation, dead code, key usage | `/optimize` | #9, #10, #16 |
| Fewer cards/modals, remove unused utilities | `/distill` | #12, #13, #18 |
| Login copy, loading/status text | `/clarify` | #19, #22 |

---

*This audit documents issues only; it does not implement fixes. Use the suggested commands or manual changes to address findings.*
