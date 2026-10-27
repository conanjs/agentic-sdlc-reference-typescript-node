# Research: revise a document

Decision records for the reference implementation (`decision-record/v2`).

## DR-001: Toolchain and alias mechanism for api

- **Tree path:** TC-Q1 (NO: new repo) → TC-Q2 (NO: no constitution tooling rules) → TC-Q3 (every slot from the stack defaults; stack Option "alias mechanism" shown at the gate)
- **Criteria:** `stacks/typescript-node/index.md` slot defaults; `stacks/typescript-node/idioms.md` Options table (TSN-15).
- **Options considered:** tsconfig `paths` with `@/` and `tsc-alias` | `package.json` `imports` with `#`
- **Chosen:** tsconfig `paths` with `@/` and `tsc-alias` — the stack default; the `@/` form is the common convention (NestJS, Vite, Next.js templates).
- **Rejected:** `package.json` `imports` — needs a `source` condition in tsx, Vitest and the ESLint resolver; no gain for an app that always runs from a build.
- **Confidence:** high
- **Supersedes:** none
- **Decided by:** tech-stack · **Approved at:** G1 (2026-10-25)

## PDM-api: Paradigm for api

- **Tree path:** PDM-Q1 (NO: no existing code) → PDM-Q2 (YES: `Document` owns the version invariant) → class-modeled@1
- **Criteria:** `Document.revise` must refuse a stale version on every path; a class with private state keeps that rule in one place.
- **Options considered:** class-modeled@1 | functional-pipeline@1
- **Chosen:** class-modeled@1 — the domain has one entity whose invariant must hold across operations.
- **Rejected:** functional-pipeline@1 — no input-to-output transform dominates; the invariant would move into free functions.
- **Confidence:** high
- **Supersedes:** none
- **Decided by:** engineering · **Approved at:** G1 (2026-10-25)

## DR-002: Layer-first layout for api (opt-in)

- **Tree path:** framework MOD-9 (feature-first is the default; layer-first only by a recorded opt-in)
- **Criteria:** this branch is the maintained layer-first example (`patterns/maintained-variant.pattern.md`); one bounded context, one feature area (documents), so MOD-9's opt-in conditions hold.
- **Options considered:** layer-first (`src/domain/` … at the top) | feature-first (`main`)
- **Chosen:** layer-first, by opt-in. Switch trigger: a fourth feature area or a second bounded context.
- **Rejected:** feature-first — it is the default and is shown on `main` (v2.x).
- **Confidence:** high
- **Supersedes:** none
- **Decided by:** owner (V) · **Approved at:** 2026-10-27

## DR-003: HTTP status-code source for api

- **Tree path:** stack Option "HTTP status-code source" (TSN-19), shown with its alternatives
- **Criteria:** named constants instead of bare numbers; reason phrases for problem titles; works with NodeNext ESM; widely known to developers and to the models agents run on.
- **Options considered:** `http-status-codes` | `http-status` | hand-written constants | `node:http` `STATUS_CODES`
- **Chosen:** `http-status-codes` 2.3 — the stack default; about 8× the weekly downloads of `http-status`; `StatusCodes` and `getReasonPhrase` import cleanly under NodeNext (tested).
- **Rejected:** `http-status` (pick it for codes outside the IANA registry); hand-written constants (duplication as routes grow); `STATUS_CODES` (reason phrases only, no named constants).
- **Confidence:** high
- **Supersedes:** none
- **Decided by:** owner (V) · **Approved at:** 2026-10-27
