# Design: Fix Design Critique Issues

## Context

The Restaurant Finder UI uses a warm terracotta palette and design tokens (oklch) and avoids the worst AI clichés. A design critique flagged: (1) the same thin gradient accent bar appears on layout, search section, login card, and result details modal, reading as a lazy repeated accent; (2) search and results both use the same card treatment so the primary action doesn’t read as dominant; (3) entrance/easing uses a cubic-bezier with overshoot (1.56), which reads as bounce. The codebase is Next.js (App Router), Tailwind, and CSS variables in `app/globals.css`. No backend or API changes are in scope.

## Goals / Non-Goals

**Goals:**

- Use the gradient accent bar in one place only (root layout) and remove it from search section, login card, and result details modal (and refinement modal if it has one).
- Differentiate the search block from result cards so the search is the dominant surface (e.g. lighter or no card treatment for search; keep card treatment for results).
- Make the primary CTA (“Find Restaurants”) more prominent (size, position, or single strong accent in that area).
- Replace the current entrance/easing with a monotonic ease-out (no overshoot) in `globals.css`.

**Non-Goals:**

- Changing any feature behavior, APIs, or auth.
- Adding dark mode or new theme variables.
- Replacing modals with panels or inline patterns in this change (noted as optional follow-up only).

## Decisions

### 1. Where to keep the gradient accent bar

- **Decision:** Keep the accent bar only in the root layout (top of viewport). Remove it from the search section container, login card, and result details modal header.
- **Rationale:** One clear brand moment avoids “same accent everywhere.” Layout is the right single place for a global chrome accent.
- **Alternatives considered:** Remove everywhere (too minimal); keep on layout + one other place (still repetitive). Rejected.

### 2. How to differentiate search from result cards

- **Decision:** Treat the search area as the primary surface without repeating the same card style. Options to implement: (a) remove the outer card from the search block (border only, no shadow, or subtle border); or (b) keep a container but use a visibly lighter treatment (e.g. no top accent bar, lighter shadow or no shadow, or different border). Result list keeps current card treatment (rounded-2xl, shadow-card) so cards remain the clear “content” level.
- **Rationale:** Hierarchy becomes “one dominant search block, then result cards,” not “card then cards.”
- **Alternatives considered:** Keep search in a full card but make it larger (doesn’t fix same-language problem). Rejected.

### 3. How to make the primary CTA more prominent

- **Decision:** Increase prominence of the “Find Restaurants” button so it’s the single strong accent in the search area. Concretely: ensure it’s the only solid accent fill in that block, and consider slightly larger size or clearer placement (e.g. right under the input). No new copy or secondary CTAs.
- **Rationale:** User should see “type then click this” in under 2 seconds. Today the header and card compete; the button should win in the search zone.
- **Alternatives considered:** Add a second CTA (rejected; one primary action). Move button above input (rejected; flow is type then submit).

### 4. Easing change

- **Decision:** Replace the current `--rf-ease-out` (and any other easing that uses overshoot) with a monotonic ease-out curve. Example: `cubic-bezier(0.33, 1, 0.68, 1)` or `cubic-bezier(0.25, 0.46, 0.45, 0.94)` so the second control-point value is ≤ 1 (no overshoot). Apply to entrance animations and any feedback transitions that currently use the bouncy curve.
- **Rationale:** Frontend-design skill: “Don’t use bounce or elastic easing.” Smooth deceleration reads as intentional.
- **Alternatives considered:** Keep overshoot for “playfulness” (rejected per critique). Use a different curve only for entrance (acceptable if we also audit other uses of the variable).

## Risks / Trade-offs

- **Visual regression:** Removing the accent bar from login and modals may make those surfaces feel plainer. Mitigation: Rely on layout bar + existing typography and spacing; if needed, add a very subtle border or background tint, not a second gradient bar.
- **Easing feels “slower”:** Monotonic ease-out can feel slightly less snappy than overshoot. Mitigation: Keep durations as-is; only change the curve. If feedback is negative, we can tune duration in a follow-up.

## Migration Plan

- No data or API migration. Deploy as a normal front-end release.
- Rollback: Revert the same files (layout, globals.css, SearchUI, login page, ResultDetailsModal; optionally SearchRefinementModal).

## Open Questions

- None for this change. Optional follow-up: explore replacing one modal (refinement or result details) with a panel or inline pattern in a future change.
