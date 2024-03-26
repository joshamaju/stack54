import type { MiddlewareHandler } from "hono";

import { getContext } from "svelte";
import * as Locals from "./locals.js";
import { makeFactory } from "./render.js";

export const view = (fn: ReturnType<typeof makeFactory>): MiddlewareHandler => {
  return async function view(ctx, next) {
    ctx.setRenderer((...args) => {
      const [name, props, opts] = args as any;

      const locals = Locals.getLocals(ctx);

      const context = new Map(opts?.context);
      context.set(Locals.key, locals);

      // @ts-expect-error
      return ctx.html(fn(name, props, { context }));
    });

    await next();
  };
};

// For getting locals inside templates/svelte components
export function getLocals(): App.Locals;
export function getLocals<T>(name?: string): T;
export function getLocals(name?: string) {
  const locals = getContext(Locals.key) as App.Locals;
  // @ts-expect-error
  return name ? locals[name] : locals;
}
