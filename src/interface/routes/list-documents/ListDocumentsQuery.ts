import { z } from "zod";

/**
 * Query of `GET /documents`: an optional `cursor` from the previous page and a `limit` of 1 to 100
 * (default 20); unknown keys are rejected (EXP-7).
 */
export const ListDocumentsQuery = z
  .object({
    cursor: z.string().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
