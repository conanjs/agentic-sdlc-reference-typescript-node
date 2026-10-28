import express, { type Express } from "express";
import type { Logger } from "pino";
import { AddComment } from "@/modules/comments/application/add-comment/AddComment.js";
import { GetComment } from "@/modules/comments/application/get-comment/GetComment.js";
import { ListComments } from "@/modules/comments/application/list-comments/ListComments.js";
import type { CommentStore } from "@/modules/comments/application/ports/CommentStore.js";
import { InMemoryCommentStore } from "@/modules/comments/infrastructure/InMemoryCommentStore.js";
import { HttpErrorMapper as CommentsErrorMapper } from "@/modules/comments/interface/errors/HttpErrorMapper.js";
import { AddCommentHandler } from "@/modules/comments/interface/routes/add-comment/AddCommentHandler.js";
import { GetCommentHandler } from "@/modules/comments/interface/routes/get-comment/GetCommentHandler.js";
import { ListCommentsHandler } from "@/modules/comments/interface/routes/list-comments/ListCommentsHandler.js";
import { CreateDocument } from "@/modules/documents/application/create-document/CreateDocument.js";
import { DeleteDocument } from "@/modules/documents/application/delete-document/DeleteDocument.js";
import { GetDocument } from "@/modules/documents/application/get-document/GetDocument.js";
import { GetDocumentHistory } from "@/modules/documents/application/get-document-history/GetDocumentHistory.js";
import { ListDocuments } from "@/modules/documents/application/list-documents/ListDocuments.js";
import type { DocumentStore } from "@/modules/documents/application/ports/DocumentStore.js";
import { ReviseDocument } from "@/modules/documents/application/revise-document/ReviseDocument.js";
import { InMemoryDocumentStore } from "@/modules/documents/infrastructure/InMemoryDocumentStore.js";
import { HttpErrorMapper as DocumentsErrorMapper } from "@/modules/documents/interface/errors/HttpErrorMapper.js";
import { CreateDocumentHandler } from "@/modules/documents/interface/routes/create-document/CreateDocumentHandler.js";
import { DeleteDocumentHandler } from "@/modules/documents/interface/routes/delete-document/DeleteDocumentHandler.js";
import { GetDocumentHandler } from "@/modules/documents/interface/routes/get-document/GetDocumentHandler.js";
import { GetDocumentHistoryHandler } from "@/modules/documents/interface/routes/get-document-history/GetDocumentHistoryHandler.js";
import { ListDocumentsHandler } from "@/modules/documents/interface/routes/list-documents/ListDocumentsHandler.js";
import { ReviseDocumentHandler } from "@/modules/documents/interface/routes/revise-document/ReviseDocumentHandler.js";
import type { IdSource } from "@/modules/shared/application/ports/IdSource.js";
import { UuidIdSource } from "@/modules/shared/infrastructure/UuidIdSource.js";
import { ErrorMiddleware } from "@/modules/shared/interface/ErrorMiddleware.js";
import { HealthHandler } from "@/modules/shared/interface/HealthHandler.js";
import { RequestLogMiddleware } from "@/modules/shared/interface/RequestLogMiddleware.js";

/**
 * The only class that knows concrete adapters: it builds the object graph and the HTTP app
 * (TSN-6, PDM-class-modeled-R9).
 *
 * @remarks
 * Each module names its mapper `HttpErrorMapper`, a name scoped by its folder; this is the one file
 * that imports two of them, so it renames them on import.
 */
export class CompositionRoot {
  /**
   * Takes the process-wide services that `main.ts` creates.
   *
   * @param logger - Root structured logger (TSN-10).
   * @param documents - Document storage adapter; integration tests pass their own to seed data.
   * @param ids - Source of new document and comment identifiers; tests may pass a predictable one.
   * @param comments - Comment storage adapter; integration tests may pass their own.
   */
  public constructor(
    private readonly logger: Logger,
    private readonly documents: DocumentStore = new InMemoryDocumentStore(),
    private readonly ids: IdSource = new UuidIdSource(),
    private readonly comments: CommentStore = new InMemoryCommentStore(),
  ) {}

  /**
   * Builds the Express app with every route and the error handler mounted.
   *
   * @returns An app that is not listening yet, so tests can bind it to a free port.
   */
  public app(): Express {
    // 1. Documents: the use cases and their handlers.
    const documentErrors = new DocumentsErrorMapper();
    const store = this.documents;
    const getDocument = new GetDocument(store);
    const create = new CreateDocumentHandler(new CreateDocument(store, this.ids), documentErrors);
    const list = new ListDocumentsHandler(new ListDocuments(store), documentErrors);
    const get = new GetDocumentHandler(getDocument, documentErrors);
    const revise = new ReviseDocumentHandler(new ReviseDocument(store), documentErrors);
    const remove = new DeleteDocumentHandler(new DeleteDocument(store), documentErrors);
    const history = new GetDocumentHistoryHandler(new GetDocumentHistory(store), documentErrors);

    // 2. Comments: reach documents only through its public GetDocument use case (MOD-3).
    const commentErrors = new CommentsErrorMapper();
    const addComment = new AddCommentHandler(
      new AddComment(getDocument, this.comments, this.ids),
      commentErrors,
    );
    const listComments = new ListCommentsHandler(
      new ListComments(getDocument, this.comments),
      commentErrors,
    );
    const getComment = new GetCommentHandler(
      new GetComment(getDocument, this.comments),
      commentErrors,
    );
    const health = new HealthHandler();

    // 3. Middleware first: the request log wraps everything, including body-parser rejections.
    const app = express();
    app.disable("x-powered-by");
    app.use(new RequestLogMiddleware(this.logger, new UuidIdSource()).handler());
    app.use(express.json({ limit: "10kb" }));

    // 4. The route table: one line per route, so every endpoint is visible in one place.
    app.get("/healthz", (req, res) => health.handle(req, res));
    app.post("/documents", (req, res) => create.handle(req, res));
    app.get("/documents", (req, res) => list.handle(req, res));
    app.get("/documents/:id", (req, res) => get.handle(req, res));
    app.put("/documents/:id", (req, res) => revise.handle(req, res));
    app.delete("/documents/:id", (req, res) => remove.handle(req, res));
    app.get("/documents/:id/versions", (req, res) => history.handle(req, res));
    app.post("/documents/:id/comments", (req, res) => addComment.handle(req, res));
    app.get("/documents/:id/comments", (req, res) => listComments.handle(req, res));
    app.get("/documents/:id/comments/:commentId", (req, res) => getComment.handle(req, res));

    // 5. Errors last, so it sees what every route and middleware throws.
    app.use(new ErrorMiddleware(this.logger).handler());
    return app;
  }
}
