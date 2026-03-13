## ADDED Requirements

### Requirement: Detect incomplete search input
The system SHALL detect when a user's free-text search input is likely incomplete or low-signal and should be refined before executing a search.

#### Scenario: Short generic query triggers refinement
- **WHEN** the user submits a search message that is very short (e.g., 1–3 words) and contains only generic cuisine or quality descriptors (such as "sushi", "good places", or "cheap food")
- **THEN** the system SHALL classify the input as incomplete
- **THEN** the system SHALL NOT immediately execute the search
- **THEN** the system SHALL open the search refinement modal instead

#### Scenario: Missing key constraints triggers refinement
- **WHEN** the user submits a search message that does not include any explicit or inferred location, distance, or "near me" style context
- **AND** the system cannot derive a complete location constraint from prior state or defaults
- **THEN** the system SHALL classify the input as incomplete
- **THEN** the system SHALL open the search refinement modal instead of executing the search

### Requirement: Present guided refinement modal
The system SHALL present a guided refinement modal that helps users quickly complete their search request using a small number of choices.

#### Scenario: Modal shows original query and steps
- **WHEN** the system opens the search refinement modal
- **THEN** the modal SHALL display the user’s original text input at the top, allowing inline editing
- **THEN** the modal SHALL show a clear indication of progress (such as a step indicator or progress bar)
- **THEN** the modal SHALL present step content using tappable chips or cards instead of long forms

#### Scenario: Modal is accessible
- **WHEN** the search refinement modal is open
- **THEN** focus SHALL be constrained within the modal until it is closed
- **THEN** the modal SHALL be dismissible via keyboard (e.g., Escape key) and close button
- **THEN** all interactive elements within the modal SHALL be reachable and operable via keyboard

### Requirement: Collect key search constraints via choices
The system SHALL allow users to specify key search constraints (including cuisine, price range, distance, rating, and open-now) via simple choices in the modal.

#### Scenario: User selects cuisine and price range
- **WHEN** the user reaches the refinement step for cuisine and price in the modal
- **THEN** the system SHALL display a curated set of cuisine options as chips or similar controls
- **AND** the system SHALL display a small set of price options (for example, `$`, `$$`, `$$$`, `$$$$`)
- **WHEN** the user selects one or more of these options
- **THEN** the selected values SHALL be stored in the in-progress search request

#### Scenario: User indicates open-now preference
- **WHEN** the user reaches the refinement step for time-based constraints
- **THEN** the system SHALL provide a clear choice to filter for places that are open now
- **WHEN** the user enables this option
- **THEN** the system SHALL mark the search request as requiring only places that are currently open

### Requirement: Offer quick templates
The system SHALL offer a small number of pre-configured search templates that users can select to quickly complete a request.

#### Scenario: User selects a quick template
- **WHEN** the refinement modal is shown
- **THEN** the system SHALL offer quick templates such as "Quick lunch nearby", "Date night", or "Family-friendly dinner"
- **WHEN** the user selects a template
- **THEN** the system SHALL pre-populate the in-progress search request with the template’s defaults (including constraints like distance and price)
- **THEN** the user SHALL be able to optionally adjust any of the pre-populated fields before executing the search

### Requirement: Always produce a complete search payload before executing
The system SHALL NOT execute a search from the refinement flow until the search payload is complete or filled with explicit defaults.

#### Scenario: Completing refinement executes with full payload
- **WHEN** the user completes all required steps in the refinement modal and clicks the primary action to view results
- **THEN** the system SHALL construct a search payload that includes query, location, and the selected or defaulted constraints
- **THEN** the system SHALL call the search API using this complete payload
- **THEN** the refinement modal SHALL close after the request is dispatched

#### Scenario: User skips refinement but still executes with defaults
- **WHEN** the refinement modal is shown
- **AND** the user chooses a "Skip and search anyway" or similar bypass option
- **THEN** the system SHALL construct a search payload using the user’s original text and reasonable defaults for any missing constraints
- **THEN** the system SHALL call the search API with this payload
- **THEN** the refinement modal SHALL close

