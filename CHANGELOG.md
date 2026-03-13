# Changelog

## [Unreleased]

### Added

- OpenSpec change `restaurant-finder-app`: proposal, design, specs (api-auth-gate, natural-language-interpretation, foursquare-integration, frontend-ui, api-contract, llm-rate-limit), and tasks for full-stack Restaurant Finder implementation.
- **Spec updates**: Non-restaurant/uninterpretable message → 422; default `limit` fixed to 10; LLM rate limit 1 call per minute per client (429 when exceeded); frontend must show clear message on 429; design and tasks updated for rate limit and renumbered.
- **Frontend + impeccable**: Frontend UI spec and design require using **teach-impeccable** to establish Design Context (CLAUDE.md); tasks add 8.0 (run teach-impeccable once) and tie 8.1/8.3 to Design Context for layout, typography, and styling.
- **openspec/changes/restaurant-finder-app/design.md**: Added "Agent skills for improvement" section listing project skills (adapt, animate, audit, frontend-design, polish, etc.) that can be used to improve the implementation; added MCP usage note to prefer jCodeMunch for codebase exploration and jDocMunch for documentation.

### Changed

- **.gitignore**: Added Cursor/agent tooling entries (`.agents/`, `.cursor/commands/`, `.cursor/hooks/state/`, `.kilocode/`, `skills-lock.json`) so plugin cache, state, and lockfiles are not committed; unstaged those paths from the index.
