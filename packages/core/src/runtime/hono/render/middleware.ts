import type { MiddlewareHandler } from "hono";

import { unsafeMakeFactory } from "../../render.js";

export const middleware = (
  fn: ReturnType<typeof unsafeMakeFactory>
): MiddlewareHandler => {
  return async function view(ctx, next) {
    ctx.setRenderer((...args) => {
      const [name, props, opts] = args as any;

      const user_context = opts?.context as Map<string, unknown> | undefined;

      const context = new Map([...(user_context?.entries() ?? [])]);

      // @ts-expect-error
      return ctx.html(fn(name, props, { context }));
    });

    await next();
  };
};
