import { connect } from "node:net";
import { Writable } from "node:stream";
import { pino } from "pino";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { CompositionRoot } from "@/CompositionRoot.js";
import { expectProblem, send, startApp, type RunningApp } from "@/test/support/http.js";

// Every log line the app writes, parsed, so tests can check the structured fields.
const lines: Record<string, unknown>[] = [];
const sink = new Writable({
  write(chunk: Buffer, _encoding, done) {
    lines.push(JSON.parse(chunk.toString()) as Record<string, unknown>);
    done();
  },
});
let app: RunningApp;
const url = (path: string) => `${app.baseUrl}${path}`;
// The line is written when the response finishes, which can come just after the client has it.
const logged = (msg: string, requestId: string) =>
  vi.waitFor(() => {
    const line = lines.find((l) => l.msg === msg && l.requestId === requestId);
    if (line === undefined) throw new Error(`no ${msg} line for ${requestId} yet`);
    return line;
  });
const completed = (requestId: string) => logged("request.completed", requestId);

beforeAll(async () => {
  app = await startApp(new CompositionRoot(pino({ level: "info" }, sink)));
});

afterAll(() => app.close());

describe("GET /healthz", () => {
  it("answers 200 with status ok", async () => {
    const response = await send(url("/healthz"), "GET");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });
});

describe("request id and request log", () => {
  it("keeps a plain incoming X-Request-Id and logs it with the request", async () => {
    const response = await send(url("/healthz"), "GET", undefined, { "x-request-id": "abc-123" });

    expect(response.headers.get("x-request-id")).toBe("abc-123");
    expect(await completed("abc-123")).toMatchObject({
      method: "GET",
      path: "/healthz",
      status: 200,
    });
  });

  it("replaces an id that is not plain text, so it cannot reach the logs", async () => {
    const response = await send(url("/healthz"), "GET", undefined, {
      "x-request-id": "x".repeat(200),
    });

    const id = response.headers.get("x-request-id") ?? "";
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(await completed(id)).toMatchObject({ path: "/healthz" });
  });

  it("logs a request the body parser rejects, with its id and status", async () => {
    const response = await send(url("/documents"), "POST", "{not json");

    const id = response.headers.get("x-request-id") ?? "";
    expect(response.status).toBe(400);
    expect(await completed(id)).toMatchObject({ method: "POST", path: "/documents", status: 400 });
  });
});

describe("requests no route serves", () => {
  it.each([
    ["GET", "/nope"],
    ["PATCH", "/documents/d1"],
  ])("answers %s %s with an about:blank 404 problem", async (method, path) => {
    await expectProblem(await send(url(path), method), 404, "about:blank", "Not Found");
  });
});

describe("a client that disconnects", () => {
  it("logs request.aborted with the request id", async () => {
    const port = Number(new URL(app.baseUrl).port);
    const socket = connect(port, "127.0.0.1");
    // Promise 100 bytes of body, send a few, then hang up: the body parser never finishes.
    socket.write(
      "POST /documents HTTP/1.1\r\nHost: test\r\nContent-Type: application/json\r\n" +
        'Content-Length: 100\r\nX-Request-Id: aborted-1\r\n\r\n{"bo',
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    socket.destroy();

    expect(await logged("request.aborted", "aborted-1")).toMatchObject({
      method: "POST",
      path: "/documents",
      level: 40,
    });
  });
});
