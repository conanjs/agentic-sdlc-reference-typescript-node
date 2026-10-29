import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { expect } from "vitest";
import type { CompositionRoot } from "@/CompositionRoot.js";

/** A running app on a free local port, for the integration tests. */
export interface RunningApp {
  /** `http://127.0.0.1:<port>`, with no trailing slash. */
  readonly baseUrl: string;
  /**
   * Stops accepting connections and waits for the server to close.
   *
   * @returns Resolves once the server is closed.
   */
  close(): Promise<void>;
}

/**
 * Starts the app a composition root builds, on a port the operating system picks.
 *
 * @param root - The composition root, built with the stores and logger the test wants.
 * @returns The base URL and a way to stop the server.
 */
export async function startApp(root: CompositionRoot): Promise<RunningApp> {
  const server: Server = root.app().listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  return {
    baseUrl: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

/**
 * Sends one JSON request.
 *
 * @param url - Full URL of the request.
 * @param method - HTTP method.
 * @param body - JSON value to send; a string is sent as is, so a test can send malformed JSON.
 * @param headers - Extra request headers.
 * @returns The response.
 */
export function send(
  url: string,
  method: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<Response> {
  return fetch(url, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
}

/**
 * Asserts that a response is an RFC 9457 problem with exactly this status, type and title. The
 * values are written out by the caller on purpose: this is the contract clients rely on (TSN-20).
 *
 * @param response - The response to check; its body is consumed.
 * @param status - Expected HTTP status, repeated in the body.
 * @param type - Expected problem `type`, written literally.
 * @param title - Expected problem `title`.
 * @returns Resolves once the body has been read and checked.
 */
export async function expectProblem(
  response: Response,
  status: number,
  type: string,
  title: string,
): Promise<void> {
  expect(response.status).toBe(status);
  expect(response.headers.get("content-type")).toMatch(/^application\/problem\+json/);
  expect(await response.json()).toEqual({ type, title, status });
}
