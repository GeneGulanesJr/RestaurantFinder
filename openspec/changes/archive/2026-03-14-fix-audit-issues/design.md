## Context

The app already uses design tokens (`--rf-*`), focus rings (`.rf-focus`), and modal ARIA/focus trap. The audit found one critical missing label (search input), several touch targets under 44px, decorative SVGs without `aria-hidden`, bounce-like entrance animation, hard-coded star color, dead code, and unstable list keys. Implementation is constrained by: no new routes or APIs, minimal visual change (no redesign), and preserving existing behavior.

## Goals / Non-Goals

**Goals:**

- Satisfy WCAG 3.3.2 for the search input and improve screen reader and keyboard usability (labels, ARIA, optional dialog).
- Meet 44×44px minimum touch targets for primary interactive elements in modals and header.
- Remove bounce-like motion from `rf-enter`; keep reduced-motion support.
- Tokenize star rating color and remove unused CSS/JS where straightforward.
- Use stable React list keys for search results.

**Non-Goals:**

- Full dark mode implementation (can be documented as future work).
- Replacing modals with drawers or routes.
- Changing gradient accent bars or card layout.
- New automated a11y tests (manual/audit only for this change).

## Decisions

1. **Search input label**  
   Add a visible `<label htmlFor="search-message">` with text such as "Search" or "What are you craving?" above or beside the input, or a single visually hidden label so the layout stays unchanged. **Choice:** Visible label (e.g. "Search" or "What are you craving?") so sighted and AT users both get a clear purpose. Place it so it doesn’t duplicate the placeholder; e.g. above the input or as sr-only if the placeholder is considered sufficient—audit requires an associated label, so prefer visible for clarity.

2. **Touch targets (44px)**  
   Use Tailwind `min-h-[44px] min-w-[44px]` or equivalent padding (e.g. `py-2.5` + `px-4`) so the hit area is at least 44×44px. Apply to: ResultDetailsModal close button, SearchRefinementModal template/filter/footer buttons, Sign out in SearchUI. **Alternative:** Larger padding only; min-height/width is clearer for compliance.

3. **Decorative SVGs**  
   Add `aria-hidden="true"` to all inline SVG icons that are redundant with adjacent text (Search, Location, Star, Clock, Dollar, Utensils, MapPin, ChevronRight, X, ArrowRight). Icons that are the only indicator (e.g. close button with only an X) already have an `aria-label` on the button; keep that and add `aria-hidden` on the SVG.

4. **Login error alert**  
   Wrap the login error message container in an element with `role="alert"` so screen readers announce it when it appears. Match the pattern used in SearchUI’s error block.

5. **ResultDetailsModal and `<dialog>`**  
   **Decision:** Keep current div-based modal with ARIA and focus trap for this change. Migrating to `<dialog>` + `showModal()` + `inert` is a larger refactor; document as a follow-up in the audit report or a short "Open questions" note. If time allows, we can do the migration in this change; otherwise defer.

6. **rf-enter keyframes**  
   Remove the 60% keyframe that does `translateY(-2px) scale(1.01)`. Use a single ease-out from initial state to final (opacity 1, translateY(0), scale(1)). Keep `transform` and `opacity` only (no layout properties).

7. **Star rating color token**  
   Add `--rf-rating` in `globals.css` (e.g. same as a warm amber/gold in oklch). Map in `tailwind.config.ts` to something like `rating: "oklch(var(--rf-rating) / <alpha-value>)"`. Replace `text-amber-500` with `text-rating` (or the chosen token name) in SearchUI and ResultDetailsModal.

8. **usePrefersReducedMotion**  
   The hook is unused; CSS already respects `prefers-reduced-motion`. **Decision:** Remove the hook from SearchUI to eliminate dead code. If we add JS-driven animations later, we can reintroduce it.

9. **Result list keys**  
   Use a stable key: e.g. `key={\`${r.name}-${r.address}\`}` or a combination that is unique per result. Avoid `key={i}`.

10. **Unused CSS (.rf-gradient-text, .rf-glass)**  
    Remove both utility blocks from `globals.css` to avoid future misuse and reduce surface area. No references in codebase.

## Risks / Trade-offs

- **Visible search label:** May slightly change layout; keep spacing consistent with current design. Mitigation: Use short label and existing spacing scale.
- **Larger touch targets:** Buttons may grow in height/width and shift layout on small screens. Mitigation: Use min-size and padding so content doesn’t overflow; test on narrow viewport.
- **Removing rf-gradient-text / rf-glass:** If something external or a future branch used them, removal could break. Mitigation: Grep confirms no current use; safe to remove.
- **Deferring `<dialog>`:** Div-based modal remains slightly less ideal for AT. Mitigation: ARIA and focus trap are correct; document migration to `<dialog>` as follow-up.

## Migration Plan

- Frontend-only change; no data or API migration.
- Deploy as a normal release; no feature flags.
- Rollback: Revert the commit; no persistent state to clean.

## Open Questions

- Whether to implement `<dialog>` migration for ResultDetailsModal in this change or leave as documented follow-up.
- Whether to add a short "Light theme only" note in docs/README if dark mode is explicitly deferred.
