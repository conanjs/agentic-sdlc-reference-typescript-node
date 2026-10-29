import type { Port } from "./Port.js";

/** Calls {@link Port} through {@link Port.run}. */
export function use(port: Port): void {
  port.run();
}
