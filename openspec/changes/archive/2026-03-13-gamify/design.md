## Context

The current restaurant search experience accepts free-text input and forwards it more or less directly to the backend. When users type vague or underspecified queries (e.g., just "Chinese" or "good places"), the results can be noisy, and the UI has no structured way to nudge users toward completing the information the backend really needs (location, cuisine, price, distance, etc.). We want to introduce a playful, modal-based refinement flow that only appears when queries are incomplete, while keeping the simple "type and search" path fast for users who already know what they want.

This design focuses on the app's existing search entry point (the main search bar and CTA) and the `execute` API route that ultimately receives search payloads. It assumes the broader UI is being upgraded to a modern theme, so the modal and chips should follow the same design tokens and animation patterns used elsewhere in the app.

## Goals / Non-Goals

**Goals:**
- Ensure that every search request sent to the backend is structurally complete (or filled with explicit defaults) so backend logic never has to guess at missing fields.
- Detect incomplete or low-signal search input and route users into a guided, gamified refinement experience in a modal.
- Make the refinement experience feel light and fun via chips, cards, micro-animations, and progress indicators, while still being keyboard- and screen-reader-friendly.
- Keep the happy path ("I already know exactly what I want") as fast as possible with minimal extra friction.
- Centralize search state into a single, well-typed search payload object that can be reused across the main page and any future search surfaces.

**Non-Goals:**
- Implement recommendation or ML-based query understanding beyond simple heuristics and rules in this iteration.
- Redesign the core search results layout or ranking algorithms; only the request-shaping behavior changes.
- Build a full-on achievements/badges system; "gamification" here is limited to micro-interactions, progress, and copy.
- Introduce new backend services; we will work within the existing `execute` route and surrounding API layer.

## Decisions

- **Introduce a `SearchRequest` model on the frontend.**  
  Represent the complete search payload as a TypeScript interface (e.g., `SearchRequest`) including fields like `query`, `location`, `cuisine`, `priceRange`, `distance`, `minRating`, `openNow`, and optional `vibeTags`. The search UI and modal will both read/write this model, and the `execute` call will serialize it to the API contract.

- **Use a lightweight heuristic to classify “incomplete” input.**  
  Before calling the backend, run the raw text through a small classifier function (e.g., `classifySearchInput`) that uses rules such as length, presence of location-like tokens ("near me", city names), or presence of intent keywords ("open now", price indicators). If the input lacks key signals and required fields are unset, we trigger the refinement modal instead of executing immediately.

- **Implement a reusable `SearchRefinementModal` component.**  
  Build a dedicated modal component that:
  - Shows the original text at the top for context and quick editing.
  - Presents a small number of steps (e.g., 2–4) with chips/cards for cuisine, price, distance, rating, and open-now.
  - Shows a compact progress bar / stepper at the top so users see how many steps remain.
  - Supports keyboard navigation and is fully accessible (focus trap, escape to close, ARIA labels).

- **Use opinionated defaults and “quick templates”.**  
  Define a small set of templates (e.g., "Quick lunch nearby", "Date night", "Family-friendly dinner") that pre-fill a `SearchRequest` with reasonable defaults. Expose them as first-class choices in the modal so users can complete the flow with one or two taps.

- **Always close the modal with a complete payload and a single execution path.**  
  The modal is responsible for ensuring required fields are filled (either by user choice or defaults). When users hit "Show results", the modal emits a fully-populated `SearchRequest` and delegates to the same search execution function used by the rest of the UI. There is no partial execution path from within the modal.

- **Add logging/analytics hooks around refinement.**  
  Define events such as `search_refinement_shown`, `search_refinement_completed`, `search_refinement_dismissed`, and `search_refinement_choice_selected` so we can tune heuristics and templates later.

## Risks / Trade-offs

- **Over-gamification could introduce friction.**  
  If heuristics are too aggressive, users who just want a quick search might be forced into the modal too often. Mitigation: start with conservative rules, only triggering refinement for clearly vague input, and revise based on analytics.

- **Modal complexity and accessibility.**  
  A multi-step, animated modal can be difficult to keep accessible. Mitigation: follow accessible modal patterns (focus trap, ARIA roles/labels, escape handling), test keyboard-only flows, and keep per-step content simple.

- **Backend contract drift.**  
  Tightening the expected search payload shape may expose inconsistencies or edge cases in current backend validation. Mitigation: version the contract carefully if needed and ensure the frontend always sends defaults for missing fields.

- **Heuristic misclassification.**  
  Some short queries ("sushi") may actually be sufficiently complete for users. Mitigation: allow users to bypass refinement quickly (e.g., "Skip and search anyway" link) while still nudging them toward better results by highlighting the benefits of refinement.

- **Scope creep toward personalization/ML.**  
  There is a risk of expanding the project into recommendation or learning systems too early. Mitigation: keep this iteration rule-based and log events to inform a later, separate personalization change.
