import { pino } from "pino";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CompositionRoot } from "@/CompositionRoot.js";
import { Document } from "@/modules/documents/domain/document/Document.js";
import { InMemoryDocumentStore } from "@/modules/documents/infrastructure/InMemoryDocumentStore.js";
import { expectProblem, send, startApp, type RunningApp } from "@/test/support/http.js";
import { valueOf } from "@/test/support/results.js";

// Contract test: problem types are written out literally (TSN-20), like the documents contract test.
let app: RunningApp;
const url = (path: string) => `${app.baseUrl}${path}`;

beforeAll(async () => {
  const store = new InMemoryDocumentStore();
  valueOf(await store.save(valueOf(Document.create("d1", "draft")), 0));
  valueOf(await store.save(valueOf(Document.create("gone", "soon deleted")), 0));
  app = await startApp(new CompositionRoot(pino({ level: "silent" }), store));
});

afterAll(() => app.close());

describe("comments on a document", () => {
  it("adds a comment, then reads it alone and in the list", async () => {
    const created = await send(url("/documents/d1/comments"), "POST", { body: "Looks good" });

    expect(created.status).toBe(201);
    const comment = (await created.json()) as { id: string; documentId: string; body: string };
    expect(comment).toMatchObject({ documentId: "d1", body: "Looks good" });
    expect(created.headers.get("location")).toBe(`/documents/d1/comments/${comment.id}`);

    const one = await send(url(`/documents/d1/comments/${comment.id}`), "GET");
    expect(await one.json()).toEqual(comment);

    const list = await send(url("/documents/d1/comments"), "GET");
    expect(await list.json()).toEqual({ items: [comment] });
  });

  it("answers 404 for a document that does not exist", async () => {
    const response = await send(url("/documents/nope/comments"), "POST", { body: "Hello" });

    await expectProblem(response, 404, "/problems/not-found", "Not Found");
  });

  it("answers 404 for a comment id the document does not have", async () => {
    const response = await send(url("/documents/d1/comments/nope"), "GET");

    await expectProblem(response, 404, "/problems/not-found", "Not Found");
  });

  it("answers 422 for a blank comment", async () => {
    const response = await send(url("/documents/d1/comments"), "POST", { body: "   " });

    await expectProblem(response, 422, "/problems/invalid-comment-body", "Unprocessable Entity");
  });

  it("answers 400 for a body with unknown keys", async () => {
    const response = await send(url("/documents/d1/comments"), "POST", { body: "x", extra: 1 });

    await expectProblem(response, 400, "/problems/invalid-request", "Bad Request");
  });

  it("answers 404 for the comments of a deleted document", async () => {
    expect((await send(url("/documents/gone/comments"), "POST", { body: "early" })).status).toBe(
      201,
    );
    expect((await send(url("/documents/gone"), "DELETE")).status).toBe(204);

    await expectProblem(
      await send(url("/documents/gone/comments"), "GET"),
      404,
      "/problems/not-found",
      "Not Found",
    );
  });
});
