---
schema: repo-architecture/v2
last-updated: 2026-10-27
updated-by: specs/001-revise-document (DR-002)
---

# Architecture: typescript-node reference

## 1. Overview

The reference implementation of the `typescript-node` stack: one small HTTP service for text documents: create, read, list page by page, revise without overwriting a newer change by someone else (optimistic concurrency), read the version history, and delete. It exists to show every stack choice in working code, not to be deployed. Risk tier: LOW.

## 2. System context

> _Standalone repo._

## 3. Components

```yaml
components:
  - {
      name: api,
      path: ./,
      kind: service,
      stack: typescript-node,
      framework: express,
      paradigm: class-modeled@1,
      decisions: [DR-001, PDM-api],
    }
```

One package, one deployable. `api` covers `src/` and `test/`. `scripts/smoke-aliases.mjs` is the only script.

## 4. Layers & dependency rules

```yaml
layers:
  - { name: domain, path: domain/, may-depend-on: [] }
  - { name: application, path: application/, may-depend-on: [domain] }
  - { name: infrastructure, path: infrastructure/, may-depend-on: [application, domain] }
  - { name: interface, path: interface/, may-depend-on: [application, domain] }
modules:
  - {
      name: shared,
      path: src/modules/shared/,
      may-depend-on: [],
      public: ["**"],
      alias: "@/modules/shared/",
    }
  - {
      name: documents,
      path: src/modules/documents/,
      may-depend-on: [shared],
      public: ["application/*.ts"],
      alias: "@/modules/documents/",
    }
```

- Layout: **feature-first** (MOD-9, DR-002), with every module under `src/modules/` (DR-004), `shared` included. Every module has the four layer folders; the layer paths above are relative to each module. `shared/` holds no feature code, imports no module, and keeps its empty layer folders with a `.gitkeep`.
- Public surface (MOD-3, IMP-5): another module may import only `documents/application/*.ts`, the use cases and their input/output types, never `application/ports/`, `domain/`, `infrastructure/` or `interface/`. There are no re-export files (TSN-18).
- Direction, inside every module: `interface -> application -> domain`, and `infrastructure -> application, domain` (adapters implement ports declared in `application/ports/`). Between modules: `documents -> shared`. No other edges, no cycles.
- Ports, by role:
  - **Input port:** the public `run()` of each use case. There is no separate interface; the controller depends on the use-case class.
  - **Gateway port:** an explicit interface in `application/ports/` (`DocumentStore`).
  - **Output port:** none. A use case returns a plain output model (`ReviseDocumentOutput`), and the handler presents it.
    This is the request/response form, chosen on purpose. Extract an input-port interface when a second implementation must stand in for a use case (a controller-test fake, a decorator). Add an output port when one use case must feed several presenters or push results asynchronously.
- Data across boundaries is plain in both directions: use cases take `<UseCase>Input` and return `<UseCase>Output`, and entities never leave `application/` (CA-4). The same plain types are what another module sees.
- The composition root sits outside the layers: `src/CompositionRoot.ts` is the only file that imports adapters, and `src/main.ts` only starts the process.
- Aliases use tsconfig `paths` (`@/*` to `src/*`, so `@/modules/documents/…` and `@/modules/shared/…`; `@/test/*` to `test/*`), rewritten in the build by `tsc-alias` (DR-001). A relative path names only a file in the same folder (IMP-1).
- Allowed exceptions to the alias rule: `scripts/smoke-aliases.mjs` (runs against `dist/`), and the root tool configs (`eslint.config.mjs`, `vitest.config.ts`, `vitest.integration.config.ts`).
- Enforced by `eslint.config.mjs`: `import-x/no-restricted-paths` layer zones per module and module zones (FF-1, MOD-3, MOD-4; resolved through the aliases; the module list is read from `src/`), `noReExports` (TSN-18), `import-x/no-cycle` (FF-2), and `no-restricted-imports` with `noRelativeOutsideFolder` (IMP-1). Test files are outside the layer zones, so a use-case test may use the in-memory adapter as its fake.

## 5. Data

| Store         | Kind                    | Owned entities | Notes                                                                                                                                                 |
| ------------- | ----------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| In-memory map | `InMemoryDocumentStore` | `Document`     | Every version of each document, oldest first; the last is current. Lost on restart. The version check and the write run with no `await` between them. |

## 6. External dependencies

| Dependency | Kind | Used for                                                                                                                                                                 | Doc |
| ---------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- |
| none       | n/a  | Libraries only: express (HTTP), zod (input and config validation), pino (logging), http-status-codes (status constants and reason phrases, interface ring only, DR-003). | n/a |

## 7. Cross-cutting concerns

- **Config:** `src/modules/shared/infrastructure/config.ts` validates `PORT` and `LOG_LEVEL` once at startup and freezes the result (TSN-9).
- **Logging:** one pino logger created in `main.ts` and injected; `no-console` in lint (TSN-10).
- **Errors:** expected failures are `Result` values. Each module's `HttpErrorMapper` turns its refusals into RFC 9457 problems (`application/problem+json`, `type` `/problems/<reason>`), and `modules/shared/interface/ErrorMiddleware` turns thrown errors into `about:blank` problems, logging every 500 (TSN-11, EXP-5, EXP-8). Status constants come from `http-status-codes`, imported only under `interface/` (TSN-19, DR-003). Why there: `ProblemDetails` and `ErrorMiddleware` sit in `modules/shared/interface/` because every module sends the same body shape and a thrown error belongs to no module; `shared` imports no feature module (MOD-4), so each module's mapper depends on `shared` and never the reverse. Status codes stay in `interface/` because a status is an HTTP delivery detail: `domain` and `application` express a refusal as a `Result` reason, so a CLI or queue consumer can reuse the same use case and choose its own exit code or retry.
- **Input validation:** zod schema `ReviseDocumentBody` at the HTTP boundary, strict (EXP-7).
- Tier B files: `src/main.ts` (process entry point), `src/modules/shared/infrastructure/config.ts` (config declaration). Everything else is Tier A (classes); lint enforces the list (PDM-class-modeled-R7).

## 8. Key decisions

| Id      | Topic                                   | Where                                    |
| ------- | --------------------------------------- | ---------------------------------------- |
| DR-001  | Toolchain and alias mechanism for `api` | specs/001-revise-document/research.md    |
| PDM-api | Paradigm for `api`                      | specs/001-revise-document/research.md    |
| DR-003  | HTTP status-code source                 | specs/001-revise-document/research.md    |
| DR-004  | Modules under `src/modules/`            | specs/001-revise-document/research.md    |
| DR-005  | Cursor pagination for document lists    | specs/002-document-lifecycle/research.md |
| DR-006  | Server-assigned document ids            | specs/002-document-lifecycle/research.md |
| DR-002  | Feature-first layout (pure move)        | specs/001-revise-document/research.md    |

## 9. Verification status

| Check                                                                                                                                                                                                                                                                                                                                                                   | Last run   | Result |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ |
| `pnpm run check` (format, lint, typecheck, unit, integration, build, smoke)                                                                                                                                                                                                                                                                                             | 2026-10-27 | pass   |
| Lint catches seeded violations (relative path, cycle, layer zone, adapter import, R1, R7, missing doc, `@remarks` beside `{@inheritDoc}`)                                                                                                                                                                                                                               | 2026-10-26 | pass   |
| Lint catches seeded violations (missing `@param`, misnamed `@param`; `{@inheritDoc}` alone stays exempt)                                                                                                                                                                                                                                                                | 2026-10-27 | pass   |
| Lint catches a seeded vague summary (`Applies one revision.` on `ReviseDocument.run`, CMT-13); it inspects all 15 method summaries                                                                                                                                                                                                                                      | 2026-10-27 | pass   |
| Lint catches seeded adapter-doc violations (`{@inheritDoc}` alone, no `{@link Port.member}`, a block tag beside it; CMT-12) and the editor hover shows the adapter's summary plus the port's `@param`/`@returns` (TypeScript 6.0.3 language service)                                                                                                                    | 2026-10-27 | pass   |
| Lint catches seeded re-exports (`export { X } from`, `export * from`; TSN-18)                                                                                                                                                                                                                                                                                           | 2026-10-27 | pass   |
| Pure move to feature-first (DR-002): `pnpm run check` passes with the same 7 unit and 4 integration tests, unchanged                                                                                                                                                                                                                                                    | 2026-10-27 | pass   |
| Lint catches seeded module-boundary violations (re-run after the `src/modules/` move, 2026-10-28): `documents/domain` from another module, `documents/application/ports`, the composition root from a module, `shared` importing `documents`, and layer direction inside a module (domain → application, application → infrastructure); a public use-case import passes | 2026-10-27 | pass   |
| Error bodies are RFC 9457 problems: integration tests assert status, `application/problem+json` and the body for 400 (validation and malformed JSON), 404 and 409                                                                                                                                                                                                       | 2026-10-27 | pass   |
| Lint catches a seeded `http-status-codes` import in `application/` (TSN-19), with the relative-path rule still active in that block                                                                                                                                                                                                                                     | 2026-10-27 | pass   |
| Pure move to `src/modules/` (DR-004): `pnpm run check` passes with the same 7 unit and 5 integration tests, unchanged                                                                                                                                                                                                                                                   | 2026-10-28 | pass   |
| Document lifecycle (spec 002): unit tests for each new use case, and an integration test that creates (201 + `Location`), reads, lists, revises, reads the history, deletes (204), then gets a 404 problem; a 400 problem for `limit=500`                                                                                                                               | 2026-10-28 | pass   |
| `validate-project.mjs`                                                                                                                                                                                                                                                                                                                                                  | 2026-10-27 | pass   |

## 10. Known gaps / out of scope

- No persistent store (a SQLite adapter behind the same port is planned), no authentication, no HTTP conditional requests yet (`ETag`/`If-Match` is the next step).
- The layer-first layout of the same code is maintained on branch `layout/layer-first` (tags `v1.x`).
- CI (`.github/workflows/check.yml`) runs `pnpm run check`, `pnpm audit` and the framework validator; run `pnpm run check` locally before pushing.
