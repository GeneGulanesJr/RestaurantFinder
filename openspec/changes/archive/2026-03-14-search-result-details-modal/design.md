## Context

The Restaurant Finder app shows a list of places returned from the Foursquare API based on a user’s search, rendered primarily through the `SearchUI` React component. The existing UI lists basic information per result but does not provide a focused view for a single place without navigating away. The Foursquare search response already contains richer metadata (formatted address, contact details, website, categories, social links) that is currently unused. We want to surface this information in a first-class, accessible way while keeping the main search context visible.

## Goals / Non-Goals

**Goals:**
- Allow users to click a search result to open a modal with rich details for that place.
- Reuse data from the existing search response wherever possible to avoid extra network round-trips.
- Provide an accessible, keyboard-navigable modal with proper focus management and multiple close affordances.
- Keep the integration localized to the search UI and related components without changing backend APIs.

**Non-Goals:**
- Changing how search is executed or how results are fetched from Foursquare.
- Introducing server-side rendering changes or new backend endpoints for place details.
- Redesigning the entire search page layout beyond what is necessary to accommodate the modal.

## Decisions

- **Modal Trigger & State Management**: Store the currently selected place in `SearchUI` state (e.g., `selectedPlace`) and derive an `isDetailsOpen` boolean from it. Clicking a result card sets `selectedPlace` and opens the modal; closing clears `selectedPlace`. This keeps modal state colocated with the search results.
- **Data Source**: Use the existing Foursquare search response object for the modal. The result card click handler will pass the full place object into state. We will not fire a separate “details” request initially, but the design leaves room to add that later if needed (e.g., for photos or reviews).
- **Modal Implementation**: Implement a reusable `ResultDetailsModal` React component that receives the selected place (or `null`) and callbacks for `onClose`. It renders an overlay, centered dialog, and content layout for place metadata. It will be controlled (no internal open state) so that `SearchUI` remains the single source of truth.
- **Accessibility**: Implement keyboard handling (ESC key to close, focus trapping inside the modal while open, ARIA roles/labels). Initial implementation may use a simple focus management strategy (move focus to the modal container on open and back to the previously focused element on close) rather than pulling in a heavy dialog library.
- **Styling**: Add modal overlay and dialog styles in `globals.css` (or a small, dedicated module) using CSS variables and responsive layout. The modal should work well on both desktop and mobile: full-bleed or near-full-screen on small viewports, centered dialog on larger screens.

## Risks / Trade-offs

- **Focus Management Complexity**: Implementing robust focus trapping and restoration can be tricky. We will start with a minimal, well-scoped implementation and consider extracting to a shared dialog component later if needed.
- **Payload Shape Coupling**: The modal will rely on fields from the Foursquare response. If the API shape changes, both the list and modal could break. Mitigation: centralize mapping from raw Foursquare place to a typed `Place` view model and use that type in both list and modal components.
- **Screen Real Estate on Mobile**: A modal overlay may feel cramped on small screens. We will design the modal to behave like a full-screen sheet on small viewports to mitigate this.

