# Problem types

Every refusal this API sends is an RFC 9457 problem (`application/problem+json`). RFC 9457 §4 asks each new problem type to document its type URI, its title and the HTTP status it is used with; this page is that documentation. Clients identify a problem by `type` (§3.1.1), never by `title`.

`type` is a relative URI with the full path, resolved against the API's base URI. RFC 9457 recommends absolute URIs where possible; changing a `type` later is a breaking change for clients.

| `type`                       | `title`               | Status | Sent when                                                                                           | Declared in                                             |
| ---------------------------- | --------------------- | ------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `/problems/invalid-request`  | Bad Request           | 400    | The body or query string fails the route's schema (unknown keys, wrong types, `limit` out of range) | `DocumentsRefusal.InvalidRequest` (`interface/errors/`) |
| `/problems/not-found`        | Not Found             | 404    | No document has the id in the path                                                                  | `LookupError.NotFound` (`application/`)                 |
| `/problems/version-conflict` | Conflict              | 409    | `expectedVersion` is not the document's current version: someone else revised it first              | `DocumentError.VersionConflict` (`domain/document/`)    |
| `/problems/invalid-body`     | Unprocessable Entity  | 422    | The body text is longer than 1000 characters                                                        | `DocumentError.InvalidBody` (`domain/document/`)        |
| `about:blank`                | The status phrase     | 4xx    | Express rejected the request before any route ran (malformed JSON, body too large)                  | `ErrorMiddleware` (`modules/shared/interface/`)         |
| `about:blank`                | Internal Server Error | 500    | Anything unexpected; the cause is logged, never sent                                                | `ErrorMiddleware` (`modules/shared/interface/`)         |

`about:blank` means the problem has no meaning beyond its status code (RFC 9457 §4.2.1). The contract test `test/integration/documents.int.test.ts` checks every named type above against the real responses.
