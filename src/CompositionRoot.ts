import express, { type Express } from "express";
import type { Logger } from "pino";
import { CreateDocument } from "@/modules/documents/application/CreateDocument.js";
import { DeleteDocument } from "@/modules/documents/application/DeleteDocument.js";
import { GetDocument } from "@/modules/documents/application/GetDocument.js";
import { GetDocumentHistory } from "@/modules/documents/application/GetDocumentHistory.js";
import { ListDocuments } from "@/modules/documents/application/ListDocuments.js";
import type { DocumentIds } from "@/modules/documents/application/ports/DocumentIds.js";
import type { DocumentStore } from "@/modules/documents/application/ports/DocumentStore.js";
import { ReviseDocument } from "@/modules/documents/application/ReviseDocument.js";
import { InMemoryDocumentStore } from "@/modules/documents/infrastructure/InMemoryDocumentStore.js";
import { UuidDocumentIds } from "@/modules/documents/infrastructure/UuidDocumentIds.js";
import { HttpErrorMapper } from "@/modules/documents/interface/errors/HttpErrorMapper.js";
import { CreateDocumentHandler } from "@/modules/documents/interface/routes/CreateDocumentHandler.js";
import { DeleteDocumentHandler } from "@/modules/documents/interface/routes/DeleteDocumentHandler.js";
import { GetDocumentHandler } from "@/modules/documents/interface/routes/GetDocumentHandler.js";
import { GetDocumentHistoryHandler } from "@/modules/documents/interface/routes/GetDocumentHistoryHandler.js";
import { ListDocumentsHandler } from "@/modules/documents/interface/routes/ListDocumentsHandler.js";
import { ReviseDocumentHandler } from "@/modules/documents/interface/routes/ReviseDocumentHandler.js";
import { ErrorMiddleware } from "@/modules/shared/interface/ErrorMiddleware.js";

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
