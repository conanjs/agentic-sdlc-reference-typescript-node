import { Router } from "express";
import { AddCommentHandler } from "@/modules/comments/interface/routes/add-comment/AddCommentHandler.js";
import { GetCommentHandler } from "@/modules/comments/interface/routes/get-comment/GetCommentHandler.js";
import { ListCommentsHandler } from "@/modules/comments/interface/routes/list-comments/ListCommentsHandler.js";
import type { AddComment } from "@/modules/comments/application/add-comment/AddComment.js";
import type { GetComment } from "@/modules/comments/application/get-comment/GetComment.js";
import type { ListComments } from "@/modules/comments/application/list-comments/ListComments.js";
import { HttpErrorMapper } from "@/modules/comments/interface/errors/HttpErrorMapper.js";

/** The use cases behind the comments routes, one per route. */
export interface CommentsUseCases {
  /** Behind `POST /documents/:id/comments`. */
  readonly add: AddComment;
  /** Behind `GET /documents/:id/comments`. */
  readonly list: ListComments;
  /** Behind `GET /documents/:id/comments/:commentId`. */
  readonly get: GetComment;
}

/**
 * The comments module's route table: every path the module serves, each bound to its handler
 * (EXP-2, DR-010).
 *
 * @remarks
 * Like the composition root, this is a wiring file, so it imports the handler folders below it. It
 * builds only interface objects (handlers and this module's mapper); the use cases arrive already
 * built, so it never sees an adapter.
 */
export class CommentsRouter {
  /**
   * Receives the module's use cases from the composition root (EXP-2).
   *
   * @param useCases - One already-built use case per route.
   */
  public constructor(private readonly useCases: CommentsUseCases) {}

  /**
   * Builds the router with full paths, so the app mounts it at the root and the handlers still read
   * the document `id` from the path.
   *
   * @returns A router that serves `/documents/:id/comments` and single comments below it.
   */
  public router(): Router {
    const errors = new HttpErrorMapper();
    const add = new AddCommentHandler(this.useCases.add, errors);
    const list = new ListCommentsHandler(this.useCases.list, errors);
    const get = new GetCommentHandler(this.useCases.get, errors);

    const router = Router();
    router.post("/documents/:id/comments", (req, res) => add.handle(req, res));
    router.get("/documents/:id/comments", (req, res) => list.handle(req, res));
    router.get("/documents/:id/comments/:commentId", (req, res) => get.handle(req, res));
    return router;
  }
}
