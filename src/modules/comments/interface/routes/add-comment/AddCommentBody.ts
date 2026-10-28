import { z } from "zod";

/** Body of `POST /documents/:id/comments`; unknown keys are rejected so typos fail loudly (EXP-7). */
export const AddCommentBody = z.object({ body: z.string() }).strict();
