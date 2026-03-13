## 1. Frontend search model and classification

- [ ] 1.1 Define a `SearchRequest` TypeScript type that represents the complete structured search payload (query, location, cuisine, price range, distance, min rating, open-now, optional tags) and lives in a reusable module.
- [ ] 1.2 Implement a `classifySearchInput` helper that inspects the raw text and existing `SearchRequest` state to decide whether refinement is required, following the heuristics in the `guided-search-refinement` spec.
- [ ] 1.3 Add basic telemetry hooks to record when refinement is triggered or bypassed (e.g., `search_refinement_shown`, `search_refinement_bypassed`).

## 2. Guided refinement modal UI

- [ ] 2.1 Implement an accessible `SearchRefinementModal` component that displays the original query, a progress indicator, and step content using chips/cards styled to match the modern theme.
- [ ] 2.2 Add refinement steps for cuisine, price range, distance, rating, and open-now, wiring selections to update an in-progress `SearchRequest`.
- [ ] 2.3 Implement quick templates (e.g., "Quick lunch nearby", "Date night", "Family-friendly dinner") that pre-populate the in-progress `SearchRequest` when selected.
- [ ] 2.4 Ensure the modal supports keyboard navigation, focus trapping, Escape-to-close, and screen reader-appropriate labels and roles.

## 3. Search flow integration

- [ ] 3.1 Update `SearchUI` to use the `SearchRequest` model and `classifySearchInput` helper before calling the `/api/execute` route, triggering the refinement modal for incomplete input instead of immediately executing.
- [ ] 3.2 Ensure that completing the refinement modal (primary action) constructs a fully-populated `SearchRequest`, closes the modal, and then calls the existing execute/search function with this payload.
- [ ] 3.3 Add a clearly-labeled "Skip and search anyway" path in the modal that builds a payload using the original text plus documented defaults and then executes the search.

## 4. Backend adaptation and validation

- [ ] 4.1 Review and, if needed, extend the `interpretMessage` and `searchPlaces` layers to accept a structured search payload that includes explicit constraints in addition to the raw message.
- [ ] 4.2 Add validation logic to reject malformed structured payloads and return descriptive error responses when required fields (such as query or location) are missing or invalid.
- [ ] 4.3 Ensure any defaults applied server-side are consistent with the defaults assumed by the frontend refinement flow.

## 5. Testing and polish

- [ ] 5.1 Add unit and/or integration tests for `classifySearchInput`, the refinement modal behavior, and the new structured payload handling.
- [ ] 5.2 Exercise keyboard-only and screen reader flows for the modal to confirm accessibility and usability.
- [ ] 5.3 Tune microcopy, chip labels, and animation timings to keep the flow feeling playful without adding excessive friction, based on manual testing.

