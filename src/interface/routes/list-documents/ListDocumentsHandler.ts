import type { Request, Response } from "express";
import { ListDocumentsQuery } from "./ListDocumentsQuery.js";
import type { ListDocuments } from "@/application/list-documents/ListDocuments.js";
import { DocumentsRefusal, type HttpErrorMapper } from "@/interface/errors/HttpErrorMapper.js";

/** Handles `GET /documents`: parses input, calls one use case and maps the result (EXP-1). */
export class ListDocumentsHandler {
  /**
   * Receives already-built collaborators from the composition root (EXP-2).
   *
   * @param listDocuments - The use case this route adapts.
   * @param errors - This module's mapper from refusal reasons to problems.
   */
  public constructor(
    private readonly listDocuments: ListDocuments,
    private readonly errors: HttpErrorMapper,
  ) {}

  /**
   * Turns one `GET /documents?cursor=&limit=` into a {@link ListDocuments} call and writes 200 with
   * `{ items, nextCursor }`, or a 400 problem for a query that fails validation.
   *
   * @param req - The query string, validated here: `cursor` from the previous page, `limit` 1 to 100.
   * @param res - Receives the page, or the problem `HttpErrorMapper` builds for a bad query.
   * @returns Resolves once the response is sent.
   */
  public async handle(req: Request, res: Response): Promise<void> {
    const parsed = ListDocumentsQuery.safeParse(req.query);
    if (!parsed.success) {
      this.errors.problemFor(DocumentsRefusal.InvalidRequest).send(res);
      return;
    }

    res.json(await this.listDocuments.run(parsed.data));
  }
}
