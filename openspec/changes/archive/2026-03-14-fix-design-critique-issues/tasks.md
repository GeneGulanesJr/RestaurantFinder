## 1. Motion easing

- [x] 1.1 In `app/globals.css`, replace `--rf-ease-out` with a monotonic ease-out curve (e.g. cubic-bezier(0.33, 1, 0.68, 1)) so no overshoot
- [x] 1.2 Ensure entrance keyframes (`rf-enter`, `rf-reveal`, `rf-stagger-in`) use only monotonic motion (no scale > 1 or translate overshoot)

## 2. Gradient accent bar

- [x] 2.1 Remove the gradient accent bar from the search section in `SearchUI.tsx` (top of search card)
- [x] 2.2 Remove the gradient accent bar from the login card in `app/login/page.tsx`
- [x] 2.3 Remove the gradient accent bar from the result details modal header in `ResultDetailsModal.tsx`
- [x] 2.4 If `SearchRefinementModal` has a gradient bar, remove it

## 3. Search block hierarchy

- [x] 3.1 In `SearchUI.tsx`, give the search block a lighter treatment than result cards (e.g. remove or soften shadow, use border-only or lighter border so it does not match result card style)
- [x] 3.2 Keep result cards using current card treatment (rounded-2xl, shadow-card); verify no regression

## 4. Primary CTA prominence

- [x] 4.1 In `SearchUI.tsx`, make the "Find Restaurants" button the single primary-style accent in the search area and increase prominence (e.g. size, padding, or placement) so it is clearly the main action
