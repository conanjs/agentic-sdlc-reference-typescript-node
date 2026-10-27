# Research: document lifecycle

Decision records for the lifecycle routes (`decision-record/v2`).

## DR-005: Cursor pagination for document lists

- **Tree path:** contract design for a list endpoint
- **Criteria:** a stable order while documents are added or removed between pages; no total count needed; the cursor stays opaque so the storage can change.
- **Options considered:** cursor (keyset after the last id) | offset and limit (`?page=3`)
- **Chosen:** cursor — `GET /documents?cursor=&limit=` returns `{ items, nextCursor }`, ascending by id; `limit` 1 to 100, default 20; one extra row is read to know whether another page exists.
- **Rejected:** offset — a document added or removed between two requests shifts every later page, so items are skipped or repeated.
- **Confidence:** high
- **Supersedes:** none
- **Decided by:** engineering · **Approved at:** 2026-10-28

## DR-006: Server-assigned document ids

- **Tree path:** contract design for a create endpoint
- **Criteria:** `POST` creates under an id the client does not choose, answered with `201 Created` and `Location`; tests need predictable ids.
- **Options considered:** a `DocumentIds` port with a random-UUID adapter | client-chosen ids with `PUT /documents/:id` | ids from the store
- **Chosen:** a `DocumentIds` port; `UuidDocumentIds` (node:crypto `randomUUID`) in production, `SequentialDocumentIds` in tests.
- **Rejected:** client-chosen ids — two clients can pick the same id; ids from the store — every adapter would have to invent ids the same way.
- **Confidence:** high
- **Supersedes:** none
- **Decided by:** engineering · **Approved at:** 2026-10-28
