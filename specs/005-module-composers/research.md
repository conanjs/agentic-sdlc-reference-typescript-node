# Research: Module composers (wiring shape W2)

## DR-012: Each module wires itself from adapters it is given

- **Tree path:** none (MOD-11 lists the wiring shapes W1, W2, W3; W2 is the framework default)
- **Criteria:** With two modules, `CompositionRoot.app()` built every use case of every module (W1, DR-010), so the root grew with each use case and knew every module's internals. Mark Seemann: "A Composition Root is a (preferably) unique location in an application where modules are composed together" — one root per application. ASP.NET Core groups each feature's registrations in an `Add{Group}` extension method; NestJS modules keep their providers private and expose only `exports`. Grzybek's modular monolith gives each module its own composition root (W3), which needs a container per module.
- **Options considered:** W1: one root builds every use case (DR-010) | W2: one root chooses the adapters; a composer per module (`<Module>Module.ts` at the module root) builds that module's use cases and router | W3: each module has its own composition root and chooses its own adapters
- **Chosen:** W2 — the root still decides every adapter and how modules meet (only it passes `documents.getDocument` to comments), and each module's wiring lives in the module; lint keeps adapters out of composers and composers out of the layers. Of DR-010 only the part about who builds the use cases changes; its routers stay.
- **Rejected:** W1 — the root must change for every use case of every module, and its imports list every module's internals (kept as the v4.1.x evidence); W3 — adapters chosen in several places, and a container per module this small service does not need.
- **Confidence:** high
- **Supersedes:** DR-010
- **Decided by:** human · **Approved at:** G3 (2026-10-29)
