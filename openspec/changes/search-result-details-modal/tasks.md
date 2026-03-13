## 1. Modal state and wiring

- [ ] 1.1 Add selected place state to `SearchUI` to track the currently selected search result and derive whether the details modal is open.
- [ ] 1.2 Update result item click handlers so clicking a result sets the selected place and opens the modal.
- [ ] 1.3 Ensure only one result is selected at a time and that selection is cleared when the modal is closed.

## 2. Result details modal component

- [ ] 2.1 Create a `ResultDetailsModal` React component that renders an overlay, dialog, and structured layout for place details using props for the selected place and close handler.
- [ ] 2.2 Map the Foursquare search response fields into a typed view model used by both the list and the modal (name, category, formatted address, phone, website, social links, etc.).
- [ ] 2.3 Wire `ResultDetailsModal` into `SearchUI` so it appears when a place is selected and hides when the user closes it.

## 3. Accessibility and keyboard behavior

- [ ] 3.1 Implement ESC key handling to close the modal when it is open.
- [ ] 3.2 Implement focus management so focus moves into the modal when it opens and returns to a sensible element (e.g., the previously selected result) when it closes.
- [ ] 3.3 Contain Tab/Shift+Tab navigation within the modal while it is open.

## 4. Styling and responsiveness

- [ ] 4.1 Add CSS for the modal overlay, dialog container, and content layout, using existing design tokens/variables where possible.
- [ ] 4.2 Ensure the modal layout adapts to small screens (e.g., full-screen or near full-screen on mobile) and is visually balanced on larger screens.
- [ ] 4.3 Add visual indication of the currently selected result in the list so users can see which place the modal corresponds to.
