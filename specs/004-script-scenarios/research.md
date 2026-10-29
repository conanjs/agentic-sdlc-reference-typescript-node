# Research: Scenarios for the repo's scripts

## DR-011: The scripts' requirements are Cucumber scenarios

- **Tree path:** none (test tooling; TST-14 applies)
- **Criteria:** TST-14 asks every check script to have its checks as Given/When/Then scenarios that run in the repo's check command. The two scripts (`check-doc-links.mjs`, `smoke-aliases.mjs`) had no tests. agent-config runs its tool scenarios with Cucumber.js (its `specs/003-cucumber-runner`, DR-003).
- **Options considered:** Cucumber.js feature files under `scripts/test/` | Vitest tests next to the unit tests | No tests (the scripts are small)
- **Chosen:** Cucumber.js feature files under `scripts/test/` — the same runner and format as agent-config, readable as requirements, and outside the lint and tsconfig scope that targets `src/` and `test/`.
- **Rejected:** Vitest — the requirement would read as code, not Given/When/Then; no tests — a broken link check would pass CI silently.
- **Confidence:** high
- **Supersedes:** none
- **Decided by:** human · **Approved at:** G3 (2026-10-29)
