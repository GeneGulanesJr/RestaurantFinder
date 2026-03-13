## 1. Theme foundation

- [x] 1.1 Define CSS variables in `app/globals.css` for colors (e.g. surface, text, border, accent, error), typography (font-sans, font-display), and spacing (e.g. space-2 through space-8); use tinted neutrals and one accent, no pure black/white
- [x] 1.2 Extend `tailwind.config.*` so theme tokens map to Tailwind utilities (e.g. `bg-surface`, `text-fg`, `font-sans`, spacing scale); ensure one source of truth
- [x] 1.3 Choose and load a web font (body and optional display) in `app/layout.tsx`; assign to CSS variables and set fallback stack

## 2. Login page

- [x] 2.1 Restyle login page (`app/login/page.tsx`) to use theme tokens only: background, text, labels, inputs, primary button, error text, and demo hint
- [x] 2.2 Apply spacing and typography from the theme so layout stays centered and readable; verify contrast for text and interactive elements

## 3. Search UI

- [x] 3.1 Restyle root layout and `SearchUI`: header, "Log out" link, form label, textarea, submit button using theme tokens
- [x] 3.2 Restyle results section: section heading, result cards (background, border, text, metadata), and spacing from theme
- [x] 3.3 Restyle loading and error states (loading button text, error alert) using theme colors; keep behavior unchanged
- [x] 3.4 Restyle "Interpreted as" line and rate-limit countdown so they use theme typography and color

## 4. Consistency and quality

- [x] 4.1 Remove any remaining hard-coded colors, font names, or spacing in login and search UI; rely only on theme-based classes
- [x] 4.2 Verify contrast (e.g. WCAG AA) for all text/background pairs and fix tokens if needed
- [x] 4.3 Quick pass: alignment, spacing rhythm, and focus states so both pages feel cohesive and accessible
