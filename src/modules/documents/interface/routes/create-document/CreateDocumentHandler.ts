import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { CreateDocumentBody } from "./CreateDocumentBody.js";
import type { CreateDocument } from "@/modules/documents/application/create-document/CreateDocument.js";
import {
  DocumentsRefusal,
  type HttpErrorMapper,
} from "@/modules/documents/interface/errors/HttpErrorMapper.js";

/** Handles `POST /documents`: parses input, calls one use case and maps the result (EXP-1). */
export class CreateDocumentHandler {
  /**
   * Receives already-built collaborators from the composition root (EXP-2).
   *
   * @param createDocument - The use case this route adapts.
   * @param errors - This module's mapper from refusal reasons to problems.
   */
  public constructor(
    private readonly createDocument: CreateDocument,
    private readonly errors: HttpErrorMapper,
  ) {}

  /**
   * Turns one `POST /documents` into a {@link CreateDocument} call and writes 201 with a `Location`
   * header and the new document, or an RFC 9457 problem: 400 for a body that fails validation, 422
   * for a body over the length limit.
   *
   * @param req - The JSON body `{ body }`, validated here.
   * @param res - Receives the created document, or the problem `HttpErrorMapper` builds for a refusal.
   * @returns Resolves once the response is sent.
   */
  public async handle(req: Request, res: Response): Promise<void> {
    const parsed = CreateDocumentBody.safeParse(req.body);
    if (!parsed.success) {
      this.errors.problemFor(DocumentsRefusal.InvalidRequest).send(res);
      return;
    }

    const result = await this.createDocument.run(parsed.data);
    if (!result.ok) {
      this.errors.problemFor(result.error).send(res);
      return;
    }

    const location = `/documents/${encodeURIComponent(result.value.id)}`;
    res.status(StatusCodes.CREATED).location(location).json(result.value);
  }
}
