## Why

Users can currently see a list of restaurant search results, but there is no way to quickly inspect rich details for a single place without leaving the page. The Foursquare API is already returning deep place data (address, contact info, website, categories, etc.), but that information is not surfaced in the UI, which makes the experience feel shallow and forces extra navigation.

## What Changes

- Introduce a dedicated **result details modal** that opens when a user clicks a search result card.
- Populate the modal from the existing Foursquare search response so that no additional network request is required in the common case.
- Show key place details in the modal, such as:
  - Name and primary category
  - Full formatted address and distance (if available)
  - Phone number and website, as clickable links
  - Any other high‑signal metadata already present in the search response (e.g., social links).
- Ensure the modal is fully keyboard accessible and supports closing via ESC, backdrop click, and an explicit close button.
- Wire the modal into the existing search UI state so selecting a result is reflected consistently (e.g., highlighted card while the modal is open).

## Capabilities

### New Capabilities
- `search-result-details-modal`: A UI capability that allows users to click a search result and view rich, structured details for that place in a modal without leaving the current page.

### Modified Capabilities
- `search-results-list`: Expand the existing search results behavior so each result can be selected and drive the new details modal, without changing the underlying search query behavior.

## Impact

- Frontend components that render the search results list (likely `SearchUI` and any child result item components).
- State management for the currently selected place and modal open/close behavior.
- Styling and layout in `globals.css` or component‑local styles to support the modal, overlay, and responsive behavior.
- Accessibility behavior (focus trapping, ARIA attributes, keyboard handling) in the search results UI.
- No new backend endpoints are required; we will reuse the existing `/api/execute` Foursquare integration and shape modal data from the current response payload.
