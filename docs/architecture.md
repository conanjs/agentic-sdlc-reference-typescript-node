---
schema: repo-architecture/v2
last-updated: 2026-10-29
updated-by: v4.0.0 (MOD-10, TSN-20)
---

# Architecture: typescript-node reference

## 1. Overview

The reference implementation of the `typescript-node` stack: one small HTTP service for text documents: create, read, list page by page, revise without overwriting a newer change by someone else (optimistic concurrency), read the version history, and delete; plus comments on a document, kept by a second module (`comments`), a `/healthz` route, and a request id with one structured log line per request. It exists to show every stack choice in working code, not to be deployed. Risk tier: LOW.

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

One package, one deployable. `api` covers `src/` and `test/`. Two scripts: `scripts/smoke-aliases.mjs` (the built output loads) and `scripts/check-doc-links.mjs` (every `{@link}` resolves, TSN-13). Their requirements are Cucumber scenarios in `scripts/test/` (DR-011), run by `pnpm run test:scripts`.

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
      public: ["application/**", "!application/ports/**"],
      alias: "@/modules/documents/",
    }
  - {
      name: comments,
      path: src/modules/comments/,
      may-depend-on: [documents, shared],
      public: ["application/**", "!application/ports/**"],
      alias: "@/modules/comments/",
    }
```

- Layout: **feature-first** (MOD-9, DR-002), with every module under `src/modules/` (DR-004), `shared` included. Every module has the four layer folders; the layer paths above are relative to each module. `shared/` holds no feature code and imports no module. A layer folder with no file yet keeps a `.gitkeep`, deleted with its first real file; since v4.1.0 every `shared/` layer has one (`application/ports/IdSource.ts` moved up from `documents`, DR-008).
- Inside a module (MOD-10): `application/` and `interface/routes/` hold one kebab-case folder per use case (`application/revise-document/ReviseDocument.ts` and its test, `interface/routes/revise-document/{ReviseDocumentHandler, ReviseDocumentBody}.ts`, with the module's router at `interface/routes/`), and `domain/` one folder per aggregate (`domain/document/Document.ts`, `DocumentError.ts`). Depth shows scope: a file in a use-case or aggregate folder serves only that one; a file at a layer root (`application/DocumentView.ts`, `application/LookupError.ts`, `application/ports/`, `interface/errors/`) is shared by several use cases of the module; `modules/shared/` is shared by several modules (`IdSource`, `RequestError`).
- Public surface (MOD-3, IMP-5): another module may import only `documents/application/**` outside `ports/`: the use cases with their input/output types, and the shared files at the layer root (`DocumentView`, `LookupError`), never `application/ports/`, `domain/`, `infrastructure/` or `interface/`. There are no re-export files (TSN-18).
- Direction, inside every module: `interface -> application -> domain`, and `infrastructure -> application, domain` (adapters implement ports declared in `application/ports/`). Between modules: `documents -> shared`, `comments -> documents, shared`. No other edges, no cycles. `comments` reaches `documents` only through its public `GetDocument` use case, injected by the composition root (DR-007); a comment holds its document's id, never the `Document` entity.
- Ports, by role:
  - **Input port:** the public `run()` of each use case. There is no separate interface; the controller depends on the use-case class.
  - **Gateway port:** an explicit interface in `application/ports/` (`DocumentStore`, `CommentStore`; `IdSource` in `shared`).
  - **Output port:** none. A use case returns a plain output model (`ReviseDocumentOutput`), and the handler presents it.
    This is the request/response form, chosen on purpose. Extract an input-port interface when a second implementation must stand in for a use case (a controller-test fake, a decorator). Add an output port when one use case must feed several presenters or push results asynchronously.
- Data across boundaries is plain in both directions: use cases take `<UseCase>Input` and return `<UseCase>Output`, and entities never leave `application/` (CA-4). The same plain types are what another module sees.
- The composition root sits outside the layers: `src/CompositionRoot.ts` is the only file that imports adapters, and `src/main.ts` only starts the process. It builds every use case and hands each module's use cases to that module's router (`interface/routes/DocumentsRouter.ts`, `CommentsRouter.ts`), which builds the handlers and the module's `HttpErrorMapper` and lists the module's full paths; `app()` only orders the middleware, `/healthz`, the module routers, the 404 handler and the error middleware (EXP-2, DR-010). A module router is a wiring file like the composition root, so it may import the handler folders below it.
- Aliases use tsconfig `paths` (`@/*` to `src/*`, so `@/modules/documents/…` and `@/modules/shared/…`; `@/test/*` to `test/*`), rewritten in the build by `tsc-alias` (DR-001). A relative path names only a file in the same folder (IMP-1).
- Allowed exceptions to the alias rule: the files in `scripts/` (`smoke-aliases.mjs` runs against `dist/`), and the root tool configs (`eslint.config.mjs`, `vitest.config.ts`, `vitest.integration.config.ts`).
- Enforced by `eslint.config.mjs`: `import-x/no-restricted-paths` layer zones per module and module zones (FF-1, MOD-3, MOD-4; resolved through the aliases; the module list is read from `src/`; a `mayDependOn` map mirrors the edges above, and any other pair of modules is blocked outright), `noReExports` (TSN-18), `import-x/no-cycle` (FF-2), and `no-restricted-imports` with `noRelativeOutsideFolder` (IMP-1). Test files are outside the layer zones, so a use-case test may use the in-memory adapter as its fake.

## 5. Data

| Store         | Kind                    | Owned entities | Notes                                                                                                                                                 |
| ------------- | ----------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| In-memory map | `InMemoryDocumentStore` | `Document`     | Every version of each document, oldest first; the last is current. Lost on restart. The version check and the write run with no `await` between them. |
| In-memory map | `InMemoryCommentStore`  | `Comment`      | The comments of each document, oldest first, keyed by document id. Lost on restart. Owned by `comments` only (MOD-6).                                 |

## 6. External dependencies

| Dependency | Kind | Used for                                                                                                                                                                 | Doc |
| ---------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- |
| none       | n/a  | Libraries only: express (HTTP), zod (input and config validation), pino (logging), http-status-codes (status constants and reason phrases, interface ring only, DR-003). | n/a |

## 7. Cross-cutting concerns

- **Config:** `src/modules/shared/infrastructure/config.ts` validates `PORT` and `LOG_LEVEL` once at startup and freezes the result (TSN-9).
- **Logging:** one pino logger created in `main.ts` and injected; `no-console` in lint (TSN-10). `modules/shared/interface/RequestLogMiddleware` runs first: it keeps a plain incoming `X-Request-Id` (at most 128 letters, digits, `_`, `.` or `-`) or makes a UUID, returns it in the response header, and logs one line per request with the id, method, path (no query string) and duration: `request.completed` with the status once the response was sent, or `request.aborted` (level warn) when the client disconnected first (EXP-3, DR-009). `ErrorMiddleware` adds the same id to `request.failed`.
- **Health:** `GET /healthz` answers `{ "status": "ok" }` while the process serves requests; it checks no dependency, since every store is in memory.
- **Errors:** expected failures are `Result` values. Each module's `HttpErrorMapper` turns its refusals into RFC 9457 problems (`application/problem+json`, `type` `/problems/<reason>`), and `modules/shared/interface/ErrorMiddleware` turns thrown errors into `about:blank` problems, logging every 500 (TSN-11, EXP-5, EXP-8). Status constants come from `http-status-codes`, imported only under `interface/` (TSN-19, DR-003). Why there: `ProblemDetails` and `ErrorMiddleware` sit in `modules/shared/interface/` because every module sends the same body shape and a thrown error belongs to no module; `shared` imports no feature module (MOD-4), so each module's mapper depends on `shared` and never the reverse. Status codes stay in `interface/` because a status is an HTTP delivery detail: `domain` and `application` express a refusal as a `Result` reason, so a CLI or queue consumer can reuse the same use case and choose its own exit code or retry.
- **Problem types:** each `type` the API sends, with its title, status and meaning, is listed in `docs/problem-types.md` (RFC 9457 §4 asks every new problem type to document these).
- **Reasons:** every refusal reason is an `as const` object with a derived type of the same name, written once in the layer that owns it: `DocumentError` (`domain/document/`), `LookupError` (`application/`) and `DocumentsRefusal` (`interface/errors/`), and in the same way `CommentError`, `CommentLookupError` and `CommentsRefusal` in `comments`. `RequestError` (`InvalidRequest`), used by the routes of both modules, sits in `modules/shared/interface/`; each module's refusal object spreads it. Code names a reason by its key; the HTTP contract test writes the problem types out literally, so a changed value fails there (TSN-20). No `enum` anywhere; lint's `noEnums` selector rejects one.
- **Input validation:** zod schemas (`ReviseDocumentBody`, `AddCommentBody`, …) at the HTTP boundary, strict (EXP-7).
- Tier B files: `src/main.ts` (process entry point), `src/modules/shared/infrastructure/config.ts` (config declaration). Everything else is Tier A (classes); lint enforces the list (PDM-class-modeled-R7).

## 8. Key decisions

| Id      | Topic                                                    | Where                                         |
| ------- | -------------------------------------------------------- | --------------------------------------------- |
| DR-001  | Toolchain and alias mechanism for `api`                  | specs/001-revise-document/research.md         |
| PDM-api | Paradigm for `api`                                       | specs/001-revise-document/research.md         |
| DR-003  | HTTP status-code source                                  | specs/001-revise-document/research.md         |
| DR-004  | Modules under `src/modules/`                             | specs/001-revise-document/research.md         |
| DR-005  | Cursor pagination for document lists                     | specs/002-document-lifecycle/research.md      |
| DR-006  | Server-assigned document ids (port superseded by DR-008) | specs/002-document-lifecycle/research.md      |
| DR-002  | Feature-first layout (pure move)                         | specs/001-revise-document/research.md         |
| DR-007  | Comments reach documents through its public use case     | specs/003-comments-and-operations/research.md |
| DR-008  | One shared `IdSource` port                               | specs/003-comments-and-operations/research.md |
| DR-009  | Request id: keep a plain incoming one, else a UUID       | specs/003-comments-and-operations/research.md |
| DR-010  | One router per module, built from injected use cases     | specs/003-comments-and-operations/research.md |

## 9. Verification status

| Check                                                                                                                                                                                                                                                                                                                                                                   | Last run   | Result |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ |
| `pnpm run check` (format, lint, typecheck, doc links, script scenarios, unit, integration, build, smoke)                                                                                                                                                                                                                                                                | 2026-10-27 | pass   |
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
| Pure move to one folder per use case and per aggregate (MOD-10): `pnpm run check` passes with the same 16 unit and 7 integration tests; `DocumentQueries.test.ts` split into one test per use case, same 5 cases                                                                                                                                                        | 2026-10-28 | pass   |
| Reasons as `as const` objects (TSN-20): each value is written once in `src/`; removing one entry from the mapper fails `tsc` (TS2741); changing `VersionConflict`'s value passes `tsc` and the unit tests and fails only the 409 contract test; the contract test gains a 422 case                                                                                      | 2026-10-28 | pass   |
| Lint catches a seeded `enum` (TSN-20, `noEnums`) in a use case, a domain file, a shared file, a Tier B file (`main.ts`), a unit test and `test/support/`                                                                                                                                                                                                                | 2026-10-28 | pass   |
| Every `{@link}` resolves in the editor's language service (`scripts/check-doc-links.mjs`, 43 links). It reported two links in `DocumentError.ts` to `Document`, a file that imports it rather than the reverse, and they became plain text                                                                                                                              | 2026-10-28 | pass   |
| Lint catches a bare status number (TSN-19, `noRawStatusCodes`) in `res.status(404)`, `res.sendStatus(204)`, `err.status === 400` and `500 < status`, and ignores arithmetic (`status / 100`) and numbers outside 100–599; it found the one real case, `status >= 500` in `ErrorMiddleware`                                                                              | 2026-10-28 | pass   |
| Comments module (spec 003): unit tests for `Comment` and each use case; an integration test that adds, reads and lists a comment (201 + `Location`), gets 404 for an unknown document or comment, 422 for a blank one, 400 for unknown keys, and 404 for the comments of a deleted document                                                                             | 2026-10-28 | pass   |
| One router per module (DR-010): `pnpm run check` passes with the same 27 unit and 21 integration tests; `CompositionRoot.app()` names no path except `/healthz`, and each module's paths are in its `interface/routes/<Module>Router.ts`                                                                                                                                | 2026-10-29 | pass   |
| Operational (spec 003): `GET /healthz` answers 200; a plain incoming `X-Request-Id` is echoed and logged; a 200-character one is replaced by a UUID; a request the body parser rejects is logged with its id and status 400                                                                                                                                             | 2026-10-28 | pass   |
| Lint catches seeded cross-module violations with the `mayDependOn` map: `documents` importing `comments` (wrong direction), `comments` importing `documents/domain`, `documents/application/ports` and `documents/interface`; `comments` importing `documents/application/DocumentView.ts` passes                                                                       | 2026-10-28 | pass   |
| Requests no route serves (`GET /nope`, `PATCH /documents/d1`) answer an `about:blank` 404 problem, no longer Express's HTML page; a client that sends half a body and disconnects is logged as `request.aborted` with its id (both were found by probing the running app, then tested)                                                                                  | 2026-10-28 | pass   |
| Script scenarios (DR-011): 7 Cucumber scenarios for `check-doc-links.mjs` and `smoke-aliases.mjs` pass in `pnpm run check`; turning the link check's exit code to 0, asking at a link's first segment, or skipping the smoke import each makes a scenario fail                                                                                                          | 2026-10-29 | pass   |
| `validate-project.mjs`                                                                                                                                                                                                                                                                                                                                                  | 2026-10-27 | pass   |

## 10. Known gaps / out of scope

- No persistent store (a SQLite adapter behind the same ports is planned), no authentication, no HTTP conditional requests yet (`ETag`/`If-Match` is the next step).
- `GET /documents/:id/comments` returns every comment, unpaginated; a cursor like `GET /documents` (DR-005) is the next step once a document can have many.
- A path that exists but does not support the method (`PATCH /documents/d1`) answers a 404 problem, not `405 Method Not Allowed` with an `Allow` header (RFC 9110 §15.5.6).
- Every `/healthz` call is logged like any request; a probe every few seconds adds one line each time.
- Deleting a document leaves its comments stored: `documents` may not depend on `comments`, so it cannot delete them. They are unreachable, because every comments use case checks that the document exists first, and they are lost on restart. A domain event (`DocumentDeleted`) that `comments` handles would remove them; not built yet.
- The layer-first layout of the same code is maintained on branch `layout/layer-first` (tags `v1.x`).
- CI (`.github/workflows/check.yml`) runs `pnpm run check`, `pnpm audit` and the framework validator; run `pnpm run check` locally before pushing.
