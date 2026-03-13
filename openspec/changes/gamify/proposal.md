## Why

The current search flow allows users to submit vague or incomplete restaurant queries, which leads to low-quality results and follow-up prompts that feel confusing and inconsistent. By turning incomplete queries into a guided, game-like refinement flow, we can make search feel more fun while ensuring every request sent to the backend is structured and complete.

## What Changes

- Introduce an inline detection step that classifies whether a user's search input is complete enough to run directly or needs refinement.
- When a query is incomplete, open a modern, animated modal instead of immediately searching, inviting the user to "build" their perfect search through a few quick choices.
- Present curated option sets (e.g., cuisine, price range, distance, rating, open-now, vibe) as tappable chips or cards, with clear progress indicators so the flow feels like a short quest, not a form.
- Allow users to start from their original text and layer on options, or pick from pre-built templates like "Quick lunch near me" or "Date night spot".
- Always assemble a fully-specified, structured search payload (including any defaults) before hitting the search API, so the backend never receives an under-specified request.
- Add gentle rewards and feedback (micro-animations, success states, and copy) that make completing all required fields feel satisfying instead of tedious.
- Track which refinement choices users most often select so future defaults and suggestions feel smarter over time.

## Capabilities

### New Capabilities
- `guided-search-refinement`: A capability that detects incomplete search input and walks the user through a short, choice-based refinement flow in a modal before executing the search.

### Modified Capabilities
- `restaurant-search`: Expand the existing restaurant search capability to require and accept a richer, fully-structured payload (query, location, cuisine, price, distance, rating, open-now, and optional tags) rather than loosely-specified free text.

## Impact

- Frontend search UI: new logic to classify incomplete queries, trigger the refinement modal, and compose a complete search request object before calling the existing execute/search route.
- Frontend components: new modal component(s), option chips/cards, and progress/feedback UI that integrate cleanly with the project's updated modern theme.
- Backend API contract: clearer expectations that search requests will include a complete, structured payload, potentially updating request validation and error messages to assume this richer shape.
- Analytics/telemetry: new events for when refinement is triggered, which options are selected, and completion/drop-off points, enabling future tuning of defaults and UX.
- Copy/UX: new microcopy and empty/error states aligned with a playful, gamified tone while remaining clear and accessible.
