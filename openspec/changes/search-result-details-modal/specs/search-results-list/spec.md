## MODIFIED Requirements

### Requirement: Search results can be selected
The system SHALL allow each search result to be selected so that it can drive the result details modal.

#### Scenario: Selecting a result highlights it
- **WHEN** the user clicks on a search result card in the list
- **THEN** that card is visually indicated as selected
- **AND THEN** the corresponding place becomes the current selection for the result details modal

#### Scenario: Selecting a different result changes selection
- **WHEN** a result is already selected
- **AND WHEN** the user clicks on a different search result card
- **THEN** the previous card is no longer visually selected
- **AND THEN** the newly clicked card becomes the selected result driving the details shown in the modal

