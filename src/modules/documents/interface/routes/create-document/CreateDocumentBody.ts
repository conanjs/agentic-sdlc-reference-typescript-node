import { z } from "zod";

/** Body of `POST /documents`; unknown keys are rejected so typos fail loudly (EXP-7). */
export const CreateDocumentBody = z.object({ body: z.string() }).strict();
