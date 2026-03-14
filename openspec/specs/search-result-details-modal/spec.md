## ADDED Requirements

### Requirement: User can open result details modal
The system SHALL allow a user to click a search result and open a modal showing rich details for that place without navigating away from the search page.

#### Scenario: Open modal from search result
- **WHEN** the user clicks on a visible search result card
- **THEN** a modal overlay opens on top of the current page
- **AND THEN** the modal shows the selected place's name, primary category, formatted address (if available), phone, and website (if available)

### Requirement: Modal uses existing search response data
The system SHALL populate the result details modal from the data returned by the existing Foursquare search request whenever that data is present.

#### Scenario: Populate modal from existing payload
- **WHEN** the modal opens for a selected place that was part of the latest search results
- **THEN** the modal's fields (name, category, address, contact details, website, and high-signal metadata like social links) are derived from the in-memory search response, not a new network request

### Requirement: Modal is dismissible and accessible
The system SHALL allow users to close the result details modal using multiple intuitive and accessible interactions.

#### Scenario: Close modal with explicit close control
- **WHEN** the modal is open
- **AND WHEN** the user clicks the close button inside the modal
- **THEN** the modal overlay disappears
- **AND THEN** focus returns to the previously focused element (typically the result card or a nearby control)

#### Scenario: Close modal with ESC key
- **WHEN** the modal is open
- **AND WHEN** the user presses the ESC key
- **THEN** the modal overlay disappears

#### Scenario: Close modal via backdrop click
- **WHEN** the modal is open
- **AND WHEN** the user clicks on the backdrop outside the dialog content
- **THEN** the modal overlay disappears

### Requirement: Modal is keyboard navigable
The system SHALL ensure that keyboard users can navigate and interact with all interactive elements within the result details modal.

#### Scenario: Tab navigation is contained within modal
- **WHEN** the modal is open
- **AND WHEN** the user uses the Tab or Shift+Tab keys
- **THEN** focus cycles only among interactive elements inside the modal until it is closed