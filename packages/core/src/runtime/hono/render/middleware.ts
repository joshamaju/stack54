import type { MiddlewareHandler } from "hono";

import { makeFactory } from "../../render.js";
import * as Locals from "../locals.js";

export const middleware = (
  fn: ReturnType<typeof makeFactory>
): MiddlewareHandler => {
  return async function view(ctx, next) {
    ctx.setRenderer((...args) => {
      const [name, props, opts] = args as any;

      const user_context = opts?.context as Map<string, unknown> | undefined;

      const locals = Locals.makeLocalsContext(ctx);

      const context = new Map([
        ...(user_context?.entries() ?? []),
        ...locals.entries(),
      ]);

      // @ts-expect-error
      return ctx.html(fn(name, props, { context }));
    });

    await next();
  };
};
