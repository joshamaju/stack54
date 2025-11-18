import type { Context } from "hono";
import { AsyncLocalStorage } from "node:async_hooks";

export const storage = new AsyncLocalStorage<Context>();

/**
 * Get the request context from `AsyncLocalStorage`.
 * @returns The request context
 */
export function getContext(): Context {
  let context = storage.getStore();

  if (context == null) {
    throw new Error(
      "No request context found. Make sure the asyncContext middleware is installed."
    );
  }

  return context;
}
