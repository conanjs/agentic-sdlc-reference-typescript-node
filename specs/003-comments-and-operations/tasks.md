# Tasks: comments and operations

The task plan for the comments module, the health route and request ids, in the form the Agentic SDLC planner writes at P5 (`task-line/v1`). T201 moves a port to `shared` (DR-008); T202 adds a port and its adapter, so it names the stack procedure with the optional `module-path` input.

- [x] T201 [US1] Move the ids port to shared as IdSource, with UuidIdSource and a SequentialIds test helper (src/modules/shared/application/ports/) [Eng] [llm]
      touches: none · refs: none · procedure: none · hot-path: no
- [x] T202 [US1] Add the CommentStore port and the InMemoryCommentStore adapter (src/modules/comments/application/ports/) [Eng] [llm]
      touches: none · refs: none · procedure: typescript-node/add-port-and-adapter · hot-path: no
      inputs: capability=keep the comments of every document; technology=process memory; use-case=AddComment; module-path=modules/comments
- [x] T203 [US1] Add the Comment entity and AddComment, ListComments and GetComment, reaching documents through GetDocument (src/modules/comments/application/) [Eng] [llm]
      touches: none · refs: none · procedure: none · hot-path: no
- [x] T204 [US1] Add one handler and route per comments use case, the request schema and the module's mapper (src/modules/comments/interface/) [Eng] [llm]
      touches: none · refs: none · procedure: none · hot-path: no
- [x] T205 [US2] Add RequestLogMiddleware, HealthHandler and the request id in ErrorMiddleware (src/modules/shared/interface/) [Eng] [llm]
      touches: none · refs: none · procedure: none · hot-path: no
- [x] T206 [US1] Enforce module edges in lint with a mayDependOn map (eslint.config.mjs) [Eng] [llm]
      touches: none · refs: none · procedure: none · hot-path: no
- [x] T207 [US2] Answer requests no route serves with an about:blank 404 problem, and log requests the client aborts (src/modules/shared/interface/) [Eng] [llm]
      touches: none · refs: none · procedure: none · hot-path: no
