import { describe, expect, it } from "vitest";
import { Comment } from "./Comment.js";
import { CommentError } from "./CommentError.js";

describe("Comment", () => {
  it("keeps its document id and text", () => {
    const result = Comment.create("c1", "d1", "Looks good");

    expect(result.ok && [result.value.id, result.value.documentId, result.value.body]).toEqual([
      "c1",
      "d1",
      "Looks good",
    ]);
  });

  it.each([
    ["empty", ""],
    ["only whitespace", "   "],
    ["over the limit", "x".repeat(Comment.MAX_BODY_LENGTH + 1)],
  ])("refuses a body that is %s", (_case, body) => {
    expect(Comment.create("c1", "d1", body)).toEqual({
      ok: false,
      error: CommentError.InvalidBody,
    });
  });
});
