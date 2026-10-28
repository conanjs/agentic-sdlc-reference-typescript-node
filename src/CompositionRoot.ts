import express, { type Express } from "express";
import type { Logger } from "pino";
import { CreateDocument } from "@/application/create-document/CreateDocument.js";
import { DeleteDocument } from "@/application/delete-document/DeleteDocument.js";
import { GetDocument } from "@/application/get-document/GetDocument.js";
import { GetDocumentHistory } from "@/application/get-document-history/GetDocumentHistory.js";
import { ListDocuments } from "@/application/list-documents/ListDocuments.js";
import type { DocumentIds } from "@/application/ports/DocumentIds.js";
import type { DocumentStore } from "@/application/ports/DocumentStore.js";
import { ReviseDocument } from "@/application/revise-document/ReviseDocument.js";
import { InMemoryDocumentStore } from "@/infrastructure/InMemoryDocumentStore.js";
import { UuidDocumentIds } from "@/infrastructure/UuidDocumentIds.js";
import { HttpErrorMapper } from "@/interface/errors/HttpErrorMapper.js";
import { CreateDocumentHandler } from "@/interface/routes/create-document/CreateDocumentHandler.js";
import { DeleteDocumentHandler } from "@/interface/routes/delete-document/DeleteDocumentHandler.js";
import { GetDocumentHandler } from "@/interface/routes/get-document/GetDocumentHandler.js";
import { GetDocumentHistoryHandler } from "@/interface/routes/get-document-history/GetDocumentHistoryHandler.js";
import { ListDocumentsHandler } from "@/interface/routes/list-documents/ListDocumentsHandler.js";
import { ReviseDocumentHandler } from "@/interface/routes/revise-document/ReviseDocumentHandler.js";
import { ErrorMiddleware } from "@/interface/ErrorMiddleware.js";

/**
 * The only class that knows concrete adapters: it builds the object graph and the HTTP app
 * (TSN-6, PDM-class-modeled-R9).
 */
export class CompositionRoot {
  /**
   * Takes the process-wide services that `main.ts` creates.
   *
   * @param logger - Root structured logger (TSN-10).
   * @param documents - Storage adapter; integration tests pass their own to seed data.
   * @param ids - Source of new document identifiers; tests may pass a predictable one.
   */
  public constructor(
    private readonly logger: Logger,
    private readonly documents: DocumentStore = new InMemoryDocumentStore(),
    private readonly ids: DocumentIds = new UuidDocumentIds(),
  ) {}

  /**
   * Builds the Express app with every route and the error handler mounted.
   *
   * @returns An app that is not listening yet, so tests can bind it to a free port.
   */
  public app(): Express {
    const errors = new HttpErrorMapper();
    const store = this.documents;
    const create = new CreateDocumentHandler(new CreateDocument(store, this.ids), errors);
    const list = new ListDocumentsHandler(new ListDocuments(store), errors);
    const get = new GetDocumentHandler(new GetDocument(store), errors);
    const revise = new ReviseDocumentHandler(new ReviseDocument(store), errors);
    const remove = new DeleteDocumentHandler(new DeleteDocument(store), errors);
    const history = new GetDocumentHistoryHandler(new GetDocumentHistory(store), errors);

    const app = express();
    app.disable("x-powered-by");
    app.use(express.json({ limit: "10kb" }));
    // The route table: one line per route, so every endpoint is visible in one place.
    app.post("/documents", (req, res) => create.handle(req, res));
    app.get("/documents", (req, res) => list.handle(req, res));
    app.get("/documents/:id", (req, res) => get.handle(req, res));
    app.put("/documents/:id", (req, res) => revise.handle(req, res));
    app.delete("/documents/:id", (req, res) => remove.handle(req, res));
    app.get("/documents/:id/versions", (req, res) => history.handle(req, res));
    app.use(new ErrorMiddleware(this.logger).handler());
    return app;
  }
}
