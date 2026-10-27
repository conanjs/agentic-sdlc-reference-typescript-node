# Constitution: typescript-node reference

## Core principles

1. **The reference teaches the rules.** Every file follows the framework's foundations, the `typescript-node` stack idioms and the `class-modeled@1` paradigm overlay; a choice that differs from them is recorded below, never silent.
2. **Checks are the definition of done.** `pnpm run check` and the framework's `validate-project.mjs` pass on every commit to `main`.
3. **Small and complete.** One feature through every layer; no feature is added unless it shows a rule the existing code cannot.

## Governance

Changes go through pull requests that keep CI green. A change that alters a framework rule is paired with a pull request in `conanjs/agent-config` that bumps this repo's pinned tag and commit.

## Agentic SDLC: defaults

- **Default paradigm:** class-modeled@1
- **Unit size / complexity:** ≤ 50 lines, ≤ 10 complexity (the CS-2 defaults)

## Agentic SDLC: style deviations

> _Framework defaults apply._

## Agentic SDLC: budgets

| Loop                          | Budget |
| ----------------------------- | ------ |
| Re-execute after failed check | 2      |
| Re-execute after review-fail  | 2      |
| Automatic rework per feature  | 1      |
| Parallel [P] tasks            | 4      |
