# Changelog

## [Unreleased]

### Added

- OpenSpec change `restaurant-finder-app`: proposal, design, specs (api-auth-gate, natural-language-interpretation, foursquare-integration, frontend-ui, api-contract), and tasks for full-stack Restaurant Finder implementation.
- **openspec/changes/restaurant-finder-app/design.md**: Added "Agent skills for improvement" section listing project skills (adapt, animate, audit, frontend-design, polish, etc.) that can be used to improve the implementation; added MCP usage note to prefer jCodeMunch for codebase exploration and jDocMunch for documentation.

### Changed

- **.gitignore**: Added Cursor/agent tooling entries (`.agents/`, `.cursor/commands/`, `.cursor/hooks/state/`, `.kilocode/`, `skills-lock.json`) so plugin cache, state, and lockfiles are not committed; unstaged those paths from the index.
