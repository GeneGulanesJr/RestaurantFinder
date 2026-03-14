## 1. Theming and global CSS

- [x] 1.1 Add `--rf-rating` token in `app/globals.css` (oklch warm amber/gold) and map in `tailwind.config.ts` (e.g. `rating`) for star rating color
- [x] 1.2 Remove bounce-like overshoot from `rf-enter` keyframes in `app/globals.css` (remove 60% keyframe; use monotonic ease-out)
- [x] 1.3 Remove unused `.rf-gradient-text` and `.rf-glass` utility blocks from `app/globals.css`

## 2. SearchUI accessibility and quality

- [x] 2.1 Add a visible `<label htmlFor="search-message">` for the search input (e.g. "Search" or "What are you craving?") in `app/components/SearchUI.tsx`
- [x] 2.2 Add `aria-hidden="true"` to decorative SVG icons in SearchUI (Search, Location, Star, Clock, Dollar, Utensils, MapPin, ChevronRight)
- [x] 2.3 Remove the unused `usePrefersReducedMotion` hook from `app/components/SearchUI.tsx`
- [x] 2.4 Use stable keys for result list items (e.g. `key={\`${r.name}-${r.address}\`}`) instead of index in `app/components/SearchUI.tsx`
- [x] 2.5 Ensure Sign out button has minimum 44×44px touch target (e.g. `min-h-[44px] min-w-[44px]` or equivalent padding) in `app/components/SearchUI.tsx`
- [x] 2.6 Replace `text-amber-500` with the new rating token (e.g. `text-rating`) for star rating in `app/components/SearchUI.tsx`

## 3. ResultDetailsModal

- [x] 3.1 Increase close button to at least 44×44px (e.g. `min-h-[44px] min-w-[44px]`) in `app/components/ResultDetailsModal.tsx`
- [x] 3.2 Replace `text-amber-500` with rating token for star in `app/components/ResultDetailsModal.tsx`
- [x] 3.3 Add `aria-hidden="true"` to decorative SVG icons in ResultDetailsModal (Location, Star, Dollar, Clock, Utensils, X)

## 4. SearchRefinementModal

- [x] 4.1 Increase touch targets for template buttons, filter chips, and footer buttons (Cancel, Show results, Skip) to at least 44px (e.g. `min-h-[44px]` or `py-2.5`) in `app/components/SearchRefinementModal.tsx`
- [x] 4.2 Add `aria-hidden="true"` to any decorative SVGs in SearchRefinementModal if present

## 5. Login page

- [x] 5.1 Add `role="alert"` to the login error message container in `app/login/page.tsx`
- [x] 5.2 Add `aria-hidden="true"` to decorative SVGs (Utensils, ArrowRight) in `app/login/page.tsx`
