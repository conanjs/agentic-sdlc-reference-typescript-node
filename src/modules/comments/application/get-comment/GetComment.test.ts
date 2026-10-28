import { describe, expect, it } from "vitest";
import { CommentLookupError } from "@/modules/comments/application/CommentLookupError.js";
import { Comment } from "@/modules/comments/domain/comment/Comment.js";
import { InMemoryCommentStore } from "@/modules/comments/infrastructure/InMemoryCommentStore.js";
import { GetDocument } from "@/modules/documents/application/get-document/GetDocument.js";
import { storeWithTwoVersions } from "@/test/support/documentStores.js";
import { valueOf } from "@/test/support/results.js";
import { GetComment } from "./GetComment.js";

describe("GetComment", () => {
  it("returns the comment as plain data", async () => {
    const comments = new InMemoryCommentStore();
    await comments.add(valueOf(Comment.create("c1", "d1", "Looks good")));

    const result = await new GetComment(
      new GetDocument(await storeWithTwoVersions()),
      comments,
    ).run({ documentId: "d1", commentId: "c1" });

    expect(result).toEqual({ ok: true, value: { id: "c1", documentId: "d1", body: "Looks good" } });
  });

  it("reports not-found for a comment on another document", async () => {
    const comments = new InMemoryCommentStore();
    await comments.add(valueOf(Comment.create("c1", "d2", "elsewhere")));

    const result = await new GetComment(
      new GetDocument(await storeWithTwoVersions()),
      comments,
    ).run({ documentId: "d1", commentId: "c1" });

    expect(result).toEqual({ ok: false, error: CommentLookupError.NotFound });
  });
});
