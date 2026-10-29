import express, { type Express } from "express";
import type { Logger } from "pino";
import { CommentsModule } from "@/modules/comments/CommentsModule.js";
import type { CommentStore } from "@/modules/comments/application/ports/CommentStore.js";
import { InMemoryCommentStore } from "@/modules/comments/infrastructure/InMemoryCommentStore.js";
import { DocumentsModule } from "@/modules/documents/DocumentsModule.js";
import type { DocumentStore } from "@/modules/documents/application/ports/DocumentStore.js";
import { InMemoryDocumentStore } from "@/modules/documents/infrastructure/InMemoryDocumentStore.js";
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
 * It chooses every adapter and hands each module its own to that module's composer, which builds
 * the module's use cases and router (MOD-11, wiring shape W2, DR-012). Modules meet only here: the
 * documents module's public lookup is passed on to comments.
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
    const documents = new DocumentsModule({ store: this.documents, ids: this.ids });
    // Comments reaches documents only through its public lookup use case (MOD-3, DR-007).
    const comments = new CommentsModule({
      store: this.comments,
      ids: this.ids,
      getDocument: documents.getDocument,
    });
    const health = new HealthHandler();
    const notFound = new NotFoundHandler();

    const app = express();
    app.disable("x-powered-by");

    // 1. Middleware first: the request log wraps everything, including body-parser rejections.
    app.use(new RequestLogMiddleware(this.logger, new UuidIdSource()).handler());
    app.use(express.json({ limit: "10kb" }));

    // 2. Routes: the operational one here, then one router per module with that module's paths.
    app.get("/healthz", (req, res) => health.handle(req, res));
    app.use(documents.router());
    app.use(comments.router());

    // 3. Whatever no route served, then errors last, so it sees what everything above throws.
    app.use((req, res) => notFound.handle(req, res));
    app.use(new ErrorMiddleware(this.logger).handler());
    return app;
  }
}
