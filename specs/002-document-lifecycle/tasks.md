# Tasks: document lifecycle

The task plan for the lifecycle routes, in the form the Agentic SDLC planner writes at P5 (`task-line/v1`). T101 adds a port and its adapter, so it names the stack procedure with the optional `module-path` input; `validate-project.mjs . --task T101` checks its scope.

- [x] T101 [US1] Add the DocumentIds port and the UuidDocumentIds adapter (src/modules/documents/application/ports/) [Eng] [llm]
      touches: none · refs: none · procedure: typescript-node/add-port-and-adapter · hot-path: no
      inputs: capability=hand out identifiers for new documents; technology=random UUID from node:crypto; use-case=CreateDocument; module-path=modules/documents
- [x] T102 [US1] Extend DocumentStore with list, history and remove, and the in-memory adapter (src/modules/documents/application/ports/) [Eng] [llm]
      touches: none · refs: none · procedure: none · hot-path: no
- [x] T103 [US1] Add CreateDocument, GetDocument, ListDocuments, DeleteDocument and GetDocumentHistory (src/modules/documents/application/) [Eng] [llm]
      touches: none · refs: none · procedure: none · hot-path: no
- [x] T104 [US1] Add one handler and route per use case, with the request schemas (src/modules/documents/interface/) [Eng] [llm]
      touches: none · refs: none · procedure: none · hot-path: no
