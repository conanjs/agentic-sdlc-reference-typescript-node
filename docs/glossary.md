# Glossary

Domain terms and naming choices for this repo (NAM-2, NAM-3).

| Term             | Meaning                                                                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Document         | A text with an id and a version; every accepted revision creates the next version.                                                                               |
| Version          | Positive integer, 1 at creation, plus one per accepted revision.                                                                                                 |
| Revise           | Replace a document's body, based on the version the caller read.                                                                                                 |
| Version conflict | The caller's version is no longer the stored one: someone else revised the document first.                                                                       |
| Module           | A folder under `src/modules/` that groups one feature area's four layers (`documents`), or the cross-cutting `shared` one. Not an ES module (one file).          |
| Problem          | An RFC 9457 error body (`application/problem+json`): `type`, `title`, `status`.                                                                                  |
| History          | Every stored version of one document, oldest first (`GET /documents/:id/versions`).                                                                              |
| Comment          | A remark on one document, by document id; never changes once written (`POST /documents/:id/comments`).                                                           |
| Request id       | Identifier of one HTTP request, in the `X-Request-Id` header and every log line about the request.                                                               |
| Cursor           | Opaque marker in a list response (`nextCursor`); pass it back as `cursor` for the next page. Today it is the last id of the page; clients must not rely on that. |

**Naming choices**

| Choice                               | Decision                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------- |
| `Store` or `Repository`              | `Store`: documents are simple keyed values, not aggregates with children. |
| Verb for new domain objects          | `create` (`Document.create`).                                             |
| Verb for assembling the object graph | `build` is not used; the composition root exposes `app()`.                |
