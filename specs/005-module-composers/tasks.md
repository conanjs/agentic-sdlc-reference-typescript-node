# Tasks: Module composers (wiring shape W2)

- [x] T401 Add `DocumentsModule` and `CommentsModule` at their module roots, built from injected adapters (src/modules/documents/, src/modules/comments/) [Eng] [llm]
      touches: none · refs: specs/005-module-composers/research.md · procedure: none · hot-path: no
- [x] T402 Build the app from the module composers; keep adapters and the cross-module hand-off in the composition root (src/CompositionRoot.ts) [Eng] [llm]
      touches: none · refs: none · procedure: none · hot-path: no
- [x] T403 Lint: a composer imports no adapter; no layer imports a composer (eslint.config.mjs) [Eng] [llm]
      touches: none · refs: none · procedure: none · hot-path: no
