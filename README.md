# Agentic SDLC reference: TypeScript on Node.js

A small Express service that shows every rule of the `typescript-node` stack of the [Agentic SDLC framework](https://github.com/conanjs/agent-config/tree/main/copilot/frameworks/agentic-sdlc) in working code: one `documents` module with its whole lifecycle (`POST /documents`, `GET /documents?cursor=&limit=`, `GET /documents/:id`, `PUT /documents/:id` with optimistic concurrency, `GET /documents/:id/versions`, `DELETE /documents/:id`), a second module for comments (`POST`/`GET /documents/:id/comments`, `GET /documents/:id/comments/:commentId`) that reaches `documents` only through its public use case, `GET /healthz`, a request id with one log line per request, errors as RFC 9457 problems, through every layer, with unit and integration tests. `main` is feature-first (`src/modules/documents/`, `src/modules/comments/`, `src/modules/shared/`), the framework default, with one folder per use case in each layer and one per aggregate in `domain/`; branch `layout/layer-first` (tags `v1.x`) keeps the same code with the four layers at the top of `src/`. It exists to be read and copied, not deployed.

## What to read

| File                                                                 | What it records                                                                    |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [`docs/architecture.md`](docs/architecture.md)                       | Components, layers, dependency rules, port roles (`repo-architecture/v2`)          |
| [`.specify/memory/constitution.md`](.specify/memory/constitution.md) | Principles, framework defaults, style deviations, budgets (`constitution-sdlc/v1`) |
| [`docs/glossary.md`](docs/glossary.md)                               | Domain terms and naming choices                                                    |
| [`specs/001-revise-document/`](specs/001-revise-document/)           | Decision records and the task plan for the one feature                             |

The framework's pointer to this repo, with the table of which rule is shown in which file, is `copilot/frameworks/agentic-sdlc/stacks/typescript-node/reference.md` in `conanjs/agent-config`. That file pins the tag and commit agents should read.

## Check it

Node.js 24 and pnpm (version from `packageManager`):

```bash
pnpm install
pnpm run check
```

`check` runs format, lint, typecheck, unit tests, integration tests, the build and a smoke import of `dist/`. CI also runs the framework's project validator (`validate-project.mjs`) against this repo, at the framework commit pinned in `.github/workflows/check.yml`.

## Changing it

The reference must keep matching the framework's rules. A change that alters a rule and this code lands as two pull requests: one here, one in `conanjs/agent-config` that bumps the pinned tag and commit. Agents working on other projects read this repo; they never edit it from a project task.
