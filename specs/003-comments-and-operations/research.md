# Research: comments and operations

Decision records for the comments module, the health route and request ids (`decision-record/v2`).

## DR-007: Comments reach documents through its public use case

- **Tree path:** framework MOD-3 (a module reaches another only through its public surface)
- **Criteria:** a comment needs an existing document; `comments` must not see the `Document` entity, the `DocumentStore` port or the documents adapters; the dependency points one way only.
- **Options considered:** inject `documents`' public `GetDocument` use case | a consumer-owned port in `comments` (`DocumentLookup`) with an adapter that calls `GetDocument` | read `DocumentStore` directly
- **Chosen:** inject `GetDocument`; `comments` maps its failure to its own `CommentLookupError.NotFound`, and keeps only the document id. Lint's `mayDependOn` map allows `comments -> documents` and blocks the reverse.
- **Rejected:** a consumer-owned port — one more port, adapter and test for one yes/no question, worth it only when the module is a candidate for a split; reading `DocumentStore` — `ports/` is not public (MOD-3), and storage would leak across modules (MOD-6).
- **Confidence:** high
- **Supersedes:** none
- **Decided by:** engineering · **Approved at:** 2026-10-28

## DR-008: One shared IdSource port

- **Tree path:** framework MOD-10 placement rule (a file moves up when a user appears outside its folder)
- **Criteria:** documents, comments and request ids all need fresh identifiers; tests need predictable ones.
- **Options considered:** move `DocumentIds` to `modules/shared/application/ports/IdSource.ts`, with `UuidIdSource` in `shared/infrastructure/` | one port per module (`DocumentIds`, `CommentIds`)
- **Chosen:** one `IdSource` port in `shared`; `SequentialIds` (with a prefix) in `test/support/`. This replaces `DocumentIds`, `UuidDocumentIds` and `SequentialDocumentIds`, and gives `shared/application/` its first file, so its `.gitkeep` goes. It supersedes only DR-006's port name and place: ids are still assigned by the server.
- **Rejected:** one port per module — the same five-line interface and adapter written twice, and a third time for request ids.
- **Confidence:** high
- **Supersedes:** DR-006
- **Decided by:** engineering · **Approved at:** 2026-10-28

## DR-009: Request id: keep a plain incoming one, else a UUID

- **Tree path:** framework EXP-3 (correlation id in middleware), TSN-10 (structured logs)
- **Criteria:** one id per request, in the response and in every log line about it; a caller (gateway, other service) may already have one; a client must not be able to inject text into the logs.
- **Options considered:** keep an incoming `X-Request-Id` that is 1–128 of `[A-Za-z0-9_.-]`, else make a UUID | always make a new id | trust any incoming value
- **Chosen:** keep a plain incoming id, else a UUID from `IdSource`; echo it in `X-Request-Id`; log `request.completed` with id, method, path without query string, status and duration, or `request.aborted` when the client disconnects before the response is sent; `request.failed` carries the same id.
- **Rejected:** always new — breaks the trace a gateway started; trust any value — newlines or very long values would reach the logs.
- **Confidence:** high
- **Supersedes:** none
- **Decided by:** engineering · **Approved at:** 2026-10-28

## DR-010: Per-module HttpErrorMapper, renamed on import

- **Tree path:** framework TSN-11 (one mapper per module), NAM-8 (file name equals the class)
- **Criteria:** each module keeps its own mapper; the folder already says which module it belongs to; the composition root must import two of them.
- **Options considered:** keep `HttpErrorMapper` in each module and rename on import in the composition root (`DocumentsErrorMapper`, `CommentsErrorMapper`) | prefix the class names in the modules
- **Chosen:** rename on import, in the composition root only, the one file that imports both.
- **Rejected:** prefixing — a longer name in every handler of every module, to solve a clash that exists in one file.
- **Confidence:** medium (revisit if more files need several mappers)
- **Supersedes:** none
- **Decided by:** engineering · **Approved at:** 2026-10-28
