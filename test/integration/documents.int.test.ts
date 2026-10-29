import { pino } from "pino";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CompositionRoot } from "@/CompositionRoot.js";
import { Document } from "@/modules/documents/domain/document/Document.js";
import { InMemoryDocumentStore } from "@/modules/documents/infrastructure/InMemoryDocumentStore.js";
import { expectProblem, startApp, type RunningApp } from "@/test/support/http.js";
import { valueOf } from "@/test/support/results.js";

// Contract test: problem types are written out literally, never taken from the code's reason objects,
// so a changed wire value fails here instead of reaching clients unnoticed (TSN-20).
let app: RunningApp;
let baseUrl: string;

beforeAll(async () => {
  const store = new InMemoryDocumentStore();
  valueOf(await store.save(valueOf(Document.create("d1", "draft")), 0));
  app = await startApp(new CompositionRoot(pino({ level: "silent" }), store));
  baseUrl = app.baseUrl;
});

afterAll(() => app.close());

function put(id: string, body: unknown): Promise<Response> {
  return fetch(`${baseUrl}/documents/${id}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("PUT /documents/:id", () => {
  it("returns the next version", async () => {
    const response = await put("d1", { body: "final", expectedVersion: 1 });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: "d1",
      body: "final",
      version: 2,
    });
  });

  it("answers 409 for a stale version", async () => {
    const response = await put("d1", { body: "late", expectedVersion: 1 });

    await expectProblem(response, 409, "/problems/version-conflict", "Conflict");
  });

  it("answers 422 for a body over the length limit", async () => {
    const response = await put("d1", { body: "x".repeat(1001), expectedVersion: 2 });

    await expectProblem(response, 422, "/problems/invalid-body", "Unprocessable Entity");
  });

  it("answers 404 for an unknown document", async () => {
    const response = await put("nope", { body: "x", expectedVersion: 1 });

    await expectProblem(response, 404, "/problems/not-found", "Not Found");
  });

  it("answers 400 for a body with unknown keys", async () => {
    const response = await put("d1", {
      body: "x",
      expectedVersion: 2,
      extra: true,
    });

    await expectProblem(response, 400, "/problems/invalid-request", "Bad Request");
  });

  it("answers an about:blank 400 for malformed JSON", async () => {
    const response = await put("d1", "{not json");

    await expectProblem(response, 400, "about:blank", "Bad Request");
  });
});

describe("document lifecycle", () => {
  async function send(method: string, path: string, body?: unknown): Promise<Response> {
    return fetch(`${baseUrl}${path}`, {
      method,
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  it("creates, reads, lists, revises, shows history and deletes a document", async () => {
    const created = await send("POST", "/documents", { body: "draft" });
    expect(created.status).toBe(201);
    const { id } = (await created.json()) as { id: string };
    expect(created.headers.get("location")).toBe(`/documents/${id}`);

    const read = await send("GET", `/documents/${id}`);
    expect(await read.json()).toEqual({ id, body: "draft", version: 1 });

    const listed = (await (await send("GET", "/documents?limit=100")).json()) as {
      items: { id: string }[];
    };
    expect(listed.items.map((d) => d.id)).toContain(id);

    expect(
      (await send("PUT", `/documents/${id}`, { body: "final", expectedVersion: 1 })).status,
    ).toBe(200);
    const history = await send("GET", `/documents/${id}/versions`);
    expect(await history.json()).toEqual({
      id,
      versions: [
        { version: 1, body: "draft" },
        { version: 2, body: "final" },
      ],
    });

    expect((await send("DELETE", `/documents/${id}`)).status).toBe(204);
    await expectProblem(
      await send("GET", `/documents/${id}`),
      404,
      "/problems/not-found",
      "Not Found",
    );
  });

  it("answers a 400 problem for a limit outside 1 to 100", async () => {
    const response = await send("GET", "/documents?limit=500");

    await expectProblem(response, 400, "/problems/invalid-request", "Bad Request");
  });
});
