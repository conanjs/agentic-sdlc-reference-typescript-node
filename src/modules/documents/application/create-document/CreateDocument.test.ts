import { describe, expect, it } from "vitest";
import { Document } from "@/modules/documents/domain/document/Document.js";
import { InMemoryDocumentStore } from "@/modules/documents/infrastructure/InMemoryDocumentStore.js";
import { SequentialDocumentIds } from "@/test/support/SequentialDocumentIds.js";
import { CreateDocument } from "./CreateDocument.js";

describe("CreateDocument", () => {
  it("stores version 1 under the next identifier", async () => {
    const store = new InMemoryDocumentStore();

    const result = await new CreateDocument(store, new SequentialDocumentIds()).run({
      body: "draft",
    });

    expect(result).toEqual({ ok: true, value: { id: "d1", body: "draft", version: 1 } });
    expect((await store.find("d1"))?.body).toBe("draft");
  });

  it("refuses a body over the limit and stores nothing", async () => {
    const store = new InMemoryDocumentStore();
    const body = "x".repeat(Document.MAX_BODY_LENGTH + 1);

    const result = await new CreateDocument(store, new SequentialDocumentIds()).run({ body });

    expect(result).toEqual({ ok: false, error: "invalid-body" });
    expect(await store.list(undefined, 10)).toHaveLength(0);
  });
});
