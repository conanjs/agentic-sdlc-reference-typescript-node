import type { Router } from "express";
import { CreateDocument } from "@/modules/documents/application/create-document/CreateDocument.js";
import { DeleteDocument } from "@/modules/documents/application/delete-document/DeleteDocument.js";
import { GetDocument } from "@/modules/documents/application/get-document/GetDocument.js";
import { GetDocumentHistory } from "@/modules/documents/application/get-document-history/GetDocumentHistory.js";
import { ListDocuments } from "@/modules/documents/application/list-documents/ListDocuments.js";
import type { DocumentStore } from "@/modules/documents/application/ports/DocumentStore.js";
import { ReviseDocument } from "@/modules/documents/application/revise-document/ReviseDocument.js";
import { DocumentsRouter } from "@/modules/documents/interface/routes/DocumentsRouter.js";
import type { IdSource } from "@/modules/shared/application/ports/IdSource.js";

/** What the composition root hands the documents module: adapters only, already built. */
export interface DocumentsDependencies {
  /** Where documents and their versions are kept. */
  readonly store: DocumentStore;
  /** Source of new document identifiers. */
  readonly ids: IdSource;
}

/**
 * Wires the documents module: builds its use cases on the adapters it is given and its router on
 * those use cases (MOD-11, wiring shape W2).
 *
 * @remarks
 * It sits at the module root, outside the layers, so it may import every layer of its own module,
 * but lint stops it from importing an adapter: the composition root chooses those. Only the
 * composition root imports this class.
 */
export class DocumentsModule {
  /** The public lookup use case, which the composition root passes on to comments (MOD-3). */
  public readonly getDocument: GetDocument;

  /**
   * Builds the shared lookup at once, so other modules can receive it before any router exists.
   *
   * @param deps - The adapters chosen by the composition root.
   */
  public constructor(private readonly deps: DocumentsDependencies) {
    this.getDocument = new GetDocument(deps.store);
  }

  /**
   * Builds one use case per route and the module's router on them.
   *
   * @returns A router that serves `/documents` and its sub-resources.
   */
  public router(): Router {
    const { store, ids } = this.deps;
    return new DocumentsRouter({
      create: new CreateDocument(store, ids),
      list: new ListDocuments(store),
      get: this.getDocument,
      revise: new ReviseDocument(store),
      remove: new DeleteDocument(store),
      history: new GetDocumentHistory(store),
    }).router();
  }
}
