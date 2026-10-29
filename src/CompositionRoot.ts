import express, { type Express, type Router } from "express";
import type { Logger } from "pino";
import { AddComment } from "@/modules/comments/application/add-comment/AddComment.js";
import { GetComment } from "@/modules/comments/application/get-comment/GetComment.js";
import { ListComments } from "@/modules/comments/application/list-comments/ListComments.js";
import type { CommentStore } from "@/modules/comments/application/ports/CommentStore.js";
import { InMemoryCommentStore } from "@/modules/comments/infrastructure/InMemoryCommentStore.js";
import { CommentsRouter } from "@/modules/comments/interface/routes/CommentsRouter.js";
import { CreateDocument } from "@/modules/documents/application/create-document/CreateDocument.js";
import { DeleteDocument } from "@/modules/documents/application/delete-document/DeleteDocument.js";
import { GetDocument } from "@/modules/documents/application/get-document/GetDocument.js";
import { GetDocumentHistory } from "@/modules/documents/application/get-document-history/GetDocumentHistory.js";
import { ListDocuments } from "@/modules/documents/application/list-documents/ListDocuments.js";
import type { DocumentStore } from "@/modules/documents/application/ports/DocumentStore.js";
import { ReviseDocument } from "@/modules/documents/application/revise-document/ReviseDocument.js";
import { InMemoryDocumentStore } from "@/modules/documents/infrastructure/InMemoryDocumentStore.js";
import { DocumentsRouter } from "@/modules/documents/interface/routes/DocumentsRouter.js";
import type { IdSource } from "@/modules/shared/application/ports/IdSource.js";
import { UuidIdSource } from "@/modules/shared/infrastructure/UuidIdSource.js";
import { ErrorMiddleware } from "@/modules/shared/interface/ErrorMiddleware.js";
import { HealthHandler } from "@/modules/shared/interface/HealthHandler.js";
import { NotFoundHandler } from "@/modules/shared/interface/NotFoundHandler.js";
import { RequestLogMiddleware } from "@/modules/shared/interface/RequestLogMiddleware.js";

/**
 * The only class that knows concrete adapters: it builds the object graph and the HTTP app
 * (TSN-6, PDM-class-modeled-R9).
 *
 * @remarks
 * It builds every use case, then hands each module's use cases to that module's router, which owns
 * the module's paths, handlers and mapper (EXP-2, DR-010).
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
    // Comments reaches documents only through this public use case (MOD-3), so both modules share it.
    const getDocument = new GetDocument(this.documents);
    const health = new HealthHandler();
    const notFound = new NotFoundHandler();

    const app = express();
    app.disable("x-powered-by");

    // 1. Middleware first: the request log wraps everything, including body-parser rejections.
    app.use(new RequestLogMiddleware(this.logger, new UuidIdSource()).handler());
    app.use(express.json({ limit: "10kb" }));

    // 2. Routes: the operational one here, then one router per module with that module's paths.
    app.get("/healthz", (req, res) => health.handle(req, res));
    app.use(this.documentsRouter(getDocument));
    app.use(this.commentsRouter(getDocument));

    // 3. Whatever no route served, then errors last, so it sees what everything above throws.
    app.use((req, res) => notFound.handle(req, res));
    app.use(new ErrorMiddleware(this.logger).handler());
    return app;
  }

  /**
   * Builds the documents use cases on the document store and the id source.
   *
   * @param getDocument - The shared lookup use case, also given to comments.
   * @returns The documents module's router.
   */
  private documentsRouter(getDocument: GetDocument): Router {
    const store = this.documents;
    return new DocumentsRouter({
      create: new CreateDocument(store, this.ids),
      list: new ListDocuments(store),
      get: getDocument,
      revise: new ReviseDocument(store),
      remove: new DeleteDocument(store),
      history: new GetDocumentHistory(store),
    }).router();
  }

  /**
   * Builds the comments use cases on the comment store, with documents reached through `getDocument`.
   *
   * @param getDocument - The documents module's public lookup use case.
   * @returns The comments module's router.
   */
  private commentsRouter(getDocument: GetDocument): Router {
    return new CommentsRouter({
      add: new AddComment(getDocument, this.comments, this.ids),
      list: new ListComments(getDocument, this.comments),
      get: new GetComment(getDocument, this.comments),
    }).router();
  }
}
