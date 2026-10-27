# Tasks: revise a document

The task plan for this feature, in the form the Agentic SDLC planner writes at P5 (`task-line/v1`). It is kept as the worked example of the task-line suffixes, including `procedure:`: T002 is the port-and-adapter task, so it names the stack procedure, and `validate-project.mjs . --task T002` checks that such a task changed only that procedure's `allowed-paths`.

- [x] T001 [US1] Add the Document entity with the version invariant (src/domain/) [Eng] [llm]
      touches: none · refs: none · procedure: none · hot-path: no
- [x] T002 [US1] Add the DocumentStore port and InMemoryDocumentStore adapter (src/application/ports/) [Eng] [llm]
      touches: none · refs: none · procedure: typescript-node/add-port-and-adapter · hot-path: no
      inputs: capability=store documents and save only over the version read; technology=in-memory; use-case=ReviseDocument
- [x] T003 [US1] Add the ReviseDocument use case (src/application/) [Eng] [llm]
      touches: none · refs: none · procedure: none · hot-path: no
- [x] T004 [US1] Add the PUT /documents/:id handler and the error mapper (src/interface/) [Eng] [llm]
      touches: none · refs: none · procedure: none · hot-path: no
