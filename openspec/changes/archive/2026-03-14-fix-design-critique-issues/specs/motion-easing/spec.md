# Spec: motion-easing

## ADDED Requirements

### Requirement: No bounce or overshoot in easing

All entrance and feedback motion SHALL use a monotonic ease-out curve (smooth deceleration with no overshoot). The global easing variable(s) used for entrance and feedback MUST NOT use a cubic-bezier control point that causes overshoot (e.g. second or fourth value &gt; 1).

#### Scenario: Entrance animation has no overshoot

- **WHEN** an element enters the view (e.g. search section, result cards, modals) using the shared entrance animation
- **THEN** the animation does not overshoot the final position (e.g. no bounce or scale &gt; 1 at any frame)

#### Scenario: Easing variable is monotonic

- **WHEN** the application uses the primary ease-out variable for entrance or feedback
- **THEN** the cubic-bezier curve has both control-point values in the range [0, 1] (no overshoot)

#### Scenario: Reduced motion respected

- **WHEN** the user has prefers-reduced-motion: reduce
- **THEN** existing reduced-motion behavior (short durations or no animation) is unchanged and still applied
