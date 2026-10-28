import { describe, expect, it } from "vitest";
import { CommentLookupError } from "@/modules/comments/application/CommentLookupError.js";
import { CommentError } from "@/modules/comments/domain/comment/CommentError.js";
import { InMemoryCommentStore } from "@/modules/comments/infrastructure/InMemoryCommentStore.js";
import { GetDocument } from "@/modules/documents/application/get-document/GetDocument.js";
import { InMemoryDocumentStore } from "@/modules/documents/infrastructure/InMemoryDocumentStore.js";
import { storeWithTwoVersions } from "@/test/support/documentStores.js";
import { SequentialIds } from "@/test/support/SequentialIds.js";
import { AddComment } from "./AddComment.js";

describe("AddComment", () => {
  it("stores the comment under the next identifier", async () => {
    const comments = new InMemoryCommentStore();
    const documents = new GetDocument(await storeWithTwoVersions());

    const result = await new AddComment(documents, comments, new SequentialIds("c")).run({
      documentId: "d1",
      body: "Looks good",
    });

    expect(result).toEqual({ ok: true, value: { id: "c1", documentId: "d1", body: "Looks good" } });
    expect(await comments.listFor("d1")).toHaveLength(1);
  });

  it("reports not-found for an unknown document and stores nothing", async () => {
    const comments = new InMemoryCommentStore();
    const documents = new GetDocument(new InMemoryDocumentStore());

    const result = await new AddComment(documents, comments, new SequentialIds("c")).run({
      documentId: "nope",
      body: "Looks good",
    });

    expect(result).toEqual({ ok: false, error: CommentLookupError.NotFound });
    expect(await comments.listFor("nope")).toHaveLength(0);
  });

  it("refuses a blank comment", async () => {
    const documents = new GetDocument(await storeWithTwoVersions());

    const result = await new AddComment(
      documents,
      new InMemoryCommentStore(),
      new SequentialIds("c"),
    ).run({ documentId: "d1", body: "  " });

    expect(result).toEqual({ ok: false, error: CommentError.InvalidBody });
  });
});
