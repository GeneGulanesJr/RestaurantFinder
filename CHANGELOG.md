# Changelog

## [Unreleased]

### Added

- OpenSpec change `restaurant-finder-app`: proposal, design, specs (api-auth-gate, natural-language-interpretation, foursquare-integration, frontend-ui, api-contract, llm-rate-limit), and tasks for full-stack Restaurant Finder implementation.
- **Spec updates**: Non-restaurant/uninterpretable message → 422; default `limit` fixed to 10; LLM rate limit 1 call per rolling 60 seconds per client (429 when exceeded); frontend must show clear message on 429; design and tasks updated for rate limit and renumbered.
- **Frontend + impeccable**: Frontend UI spec and design require using **teach-impeccable** to establish Design Context in **.cursorrules** (Cursor); tasks add 8.0 (run teach-impeccable once) and tie 8.1/8.3 to Design Context for layout, typography, and styling.
- **Clarifications**: SPEC-REVIEW "What's still unclear" added (rate limit client/rolling/edge, message validation, Foursquare/OpenRouter/timeout, 429 header, design context). Design/specs/tasks updated for Cloudflare: rolling 60s per-client rate limit, client key via `CF-Connecting-IP` (fallback `X-Forwarded-For`), shared store preference (Durable Objects); whitespace-only message → 400; query/near non-empty → 422; Retry-After header for 429; task 3.2 and api-contract/natural-language/llm-rate-limit specs aligned.
- **JSON validation and system prompts**: OpenRouter and Foursquare API calls must validate responses as JSON (parse + Zod). Added OpenRouter system prompt (`prompts/openrouter-system.md`) and Foursquare request/response contract (`prompts/foursquare-contract.md`) defining what we send and what we expect (JSON). Specs updated: natural-language-interpretation (system prompt + JSON parse/validate), foursquare-integration (contract + JSON parse/validate before map). Design and tasks updated (schemas 2.3, LLM 5.1–5.2, Foursquare 6.1–6.2, tests 9.4–9.5).
- **Login page**: Added login at `/login` with username **demo** and password **1234**; session-based protection of `/`; new capability `login-page`, spec `specs/login-page/spec.md`, design decision, tasks §7 (login + session) and §9 (login UI + protected root), tests 10.6; README to document demo/1234.
- **openspec/changes/restaurant-finder-app/design.md**: Added "Agent skills for improvement" section listing project skills (adapt, animate, audit, frontend-design, polish, etc.) that can be used to improve the implementation; added MCP usage note to prefer jCodeMunch for codebase exploration and jDocMunch for documentation.

### Changed

- **.gitignore**: Added Cursor/agent tooling entries (`.agents/`, `.cursor/commands/`, `.cursor/hooks/state/`, `.kilocode/`, `skills-lock.json`) so plugin cache, state, and lockfiles are not committed; unstaged those paths from the index.
