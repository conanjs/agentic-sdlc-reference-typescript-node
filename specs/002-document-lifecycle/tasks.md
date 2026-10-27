# Tasks: document lifecycle

The task plan for the lifecycle routes, in the form the Agentic SDLC planner writes at P5 (`task-line/v1`). T101 adds a port and its adapter, so it names the stack procedure (no `module-path` input: this repo opted in to layer-first, DR-002); `validate-project.mjs . --task T101` checks its scope.

- [x] T101 [US1] Add the DocumentIds port and the UuidDocumentIds adapter (src/application/ports/) [Eng] [llm]
      touches: none · refs: none · procedure: typescript-node/add-port-and-adapter · hot-path: no
      inputs: capability=hand out identifiers for new documents; technology=random UUID from node:crypto; use-case=CreateDocument
- [x] T102 [US1] Extend DocumentStore with list, history and remove, and the in-memory adapter (src/application/ports/) [Eng] [llm]
      touches: none · refs: none · procedure: none · hot-path: no
- [x] T103 [US1] Add CreateDocument, GetDocument, ListDocuments, DeleteDocument and GetDocumentHistory (src/application/) [Eng] [llm]
      touches: none · refs: none · procedure: none · hot-path: no
- [x] T104 [US1] Add one handler and route per use case, with the request schemas (src/interface/) [Eng] [llm]
      touches: none · refs: none · procedure: none · hot-path: no
