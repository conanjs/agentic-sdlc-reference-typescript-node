import { Router } from "express";
import { CreateDocumentHandler } from "@/modules/documents/interface/routes/create-document/CreateDocumentHandler.js";
import { DeleteDocumentHandler } from "@/modules/documents/interface/routes/delete-document/DeleteDocumentHandler.js";
import { GetDocumentHandler } from "@/modules/documents/interface/routes/get-document/GetDocumentHandler.js";
import { GetDocumentHistoryHandler } from "@/modules/documents/interface/routes/get-document-history/GetDocumentHistoryHandler.js";
import { ListDocumentsHandler } from "@/modules/documents/interface/routes/list-documents/ListDocumentsHandler.js";
import { ReviseDocumentHandler } from "@/modules/documents/interface/routes/revise-document/ReviseDocumentHandler.js";
import type { CreateDocument } from "@/modules/documents/application/create-document/CreateDocument.js";
import type { DeleteDocument } from "@/modules/documents/application/delete-document/DeleteDocument.js";
import type { GetDocument } from "@/modules/documents/application/get-document/GetDocument.js";
import type { GetDocumentHistory } from "@/modules/documents/application/get-document-history/GetDocumentHistory.js";
import type { ListDocuments } from "@/modules/documents/application/list-documents/ListDocuments.js";
import type { ReviseDocument } from "@/modules/documents/application/revise-document/ReviseDocument.js";
import { HttpErrorMapper } from "@/modules/documents/interface/errors/HttpErrorMapper.js";

/** The use cases behind the documents routes, one per route. */
export interface DocumentsUseCases {
  /** Behind `POST /documents`. */
  readonly create: CreateDocument;
  /** Behind `GET /documents`. */
  readonly list: ListDocuments;
  /** Behind `GET /documents/:id`. */
  readonly get: GetDocument;
  /** Behind `PUT /documents/:id`. */
  readonly revise: ReviseDocument;
  /** Behind `DELETE /documents/:id`. */
  readonly remove: DeleteDocument;
  /** Behind `GET /documents/:id/versions`. */
  readonly history: GetDocumentHistory;
}

/**
 * The documents module's route table: every path the module serves, each bound to its handler
 * (EXP-2, DR-010).
 *
 * @remarks
 * Like the composition root, this is a wiring file, so it imports the handler folders below it. It
 * builds only interface objects (handlers and this module's mapper); the use cases arrive already
 * built, so it never sees an adapter.
 */
export class DocumentsRouter {
  /**
   * Receives the module's use cases from the composition root (EXP-2).
   *
   * @param useCases - One already-built use case per route.
   */
  public constructor(private readonly useCases: DocumentsUseCases) {}

  /**
   * Builds the router with full paths, so the app mounts it at the root.
   *
   * @returns A router that serves `/documents` and its sub-resources.
   */
  public router(): Router {
    const errors = new HttpErrorMapper();
    const create = new CreateDocumentHandler(this.useCases.create, errors);
    const list = new ListDocumentsHandler(this.useCases.list, errors);
    const get = new GetDocumentHandler(this.useCases.get, errors);
    const revise = new ReviseDocumentHandler(this.useCases.revise, errors);
    const remove = new DeleteDocumentHandler(this.useCases.remove, errors);
    const history = new GetDocumentHistoryHandler(this.useCases.history, errors);

    const router = Router();
    router.post("/documents", (req, res) => create.handle(req, res));
    router.get("/documents", (req, res) => list.handle(req, res));
    router.get("/documents/:id", (req, res) => get.handle(req, res));
    router.put("/documents/:id", (req, res) => revise.handle(req, res));
    router.delete("/documents/:id", (req, res) => remove.handle(req, res));
    router.get("/documents/:id/versions", (req, res) => history.handle(req, res));
    return router;
  }
}
