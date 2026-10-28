import { describe, expect, it } from "vitest";
import { CommentLookupError } from "@/modules/comments/application/CommentLookupError.js";
import { Comment } from "@/modules/comments/domain/comment/Comment.js";
import { InMemoryCommentStore } from "@/modules/comments/infrastructure/InMemoryCommentStore.js";
import { GetDocument } from "@/modules/documents/application/get-document/GetDocument.js";
import { InMemoryDocumentStore } from "@/modules/documents/infrastructure/InMemoryDocumentStore.js";
import { storeWithTwoVersions } from "@/test/support/documentStores.js";
import { valueOf } from "@/test/support/results.js";
import { ListComments } from "./ListComments.js";

describe("ListComments", () => {
  it("returns the document's comments, oldest first", async () => {
    const comments = new InMemoryCommentStore();
    await comments.add(valueOf(Comment.create("c1", "d1", "first")));
    await comments.add(valueOf(Comment.create("c2", "d1", "second")));
    await comments.add(valueOf(Comment.create("c3", "d2", "elsewhere")));

    const result = await new ListComments(
      new GetDocument(await storeWithTwoVersions()),
      comments,
    ).run({ documentId: "d1" });

    expect(valueOf(result).items.map((c) => c.body)).toEqual(["first", "second"]);
  });

  it("reports not-found when the document is gone, even with comments stored", async () => {
    const comments = new InMemoryCommentStore();
    await comments.add(valueOf(Comment.create("c1", "d1", "orphan")));

    const result = await new ListComments(
      new GetDocument(new InMemoryDocumentStore()),
      comments,
    ).run({ documentId: "d1" });

    expect(result).toEqual({ ok: false, error: CommentLookupError.NotFound });
  });
});
