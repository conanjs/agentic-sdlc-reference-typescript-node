import type { Router } from "express";
import { AddComment } from "@/modules/comments/application/add-comment/AddComment.js";
import { GetComment } from "@/modules/comments/application/get-comment/GetComment.js";
import { ListComments } from "@/modules/comments/application/list-comments/ListComments.js";
import type { CommentStore } from "@/modules/comments/application/ports/CommentStore.js";
import { CommentsRouter } from "@/modules/comments/interface/routes/CommentsRouter.js";
import type { GetDocument } from "@/modules/documents/application/get-document/GetDocument.js";
import type { IdSource } from "@/modules/shared/application/ports/IdSource.js";

/** What the composition root hands the comments module: its adapters and the documents lookup. */
export interface CommentsDependencies {
  /** Where comments are kept. */
  readonly store: CommentStore;
  /** Source of new comment identifiers. */
  readonly ids: IdSource;
  /** The documents module's public lookup, the only way comments reaches documents (DR-007). */
  readonly getDocument: GetDocument;
}

/**
 * Wires the comments module: builds its use cases on what it is given and its router on those use
 * cases (MOD-11, wiring shape W2).
 *
 * @remarks
 * It sits at the module root, outside the layers, so it may import every layer of its own module,
 * but lint stops it from importing an adapter: the composition root chooses those. Only the
 * composition root imports this class.
 */
export class CommentsModule {
  /**
   * Keeps what the composition root built.
   *
   * @param deps - The adapters, and the documents lookup, chosen by the composition root.
   */
  public constructor(private readonly deps: CommentsDependencies) {}

  /**
   * Builds one use case per route and the module's router on them.
   *
   * @returns A router that serves `/documents/:id/comments` and single comments below it.
   */
  public router(): Router {
    const { store, ids, getDocument } = this.deps;
    return new CommentsRouter({
      add: new AddComment(getDocument, store, ids),
      list: new ListComments(getDocument, store),
      get: new GetComment(getDocument, store),
    }).router();
  }
}
