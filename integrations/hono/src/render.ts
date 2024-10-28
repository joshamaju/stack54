import type { MiddlewareHandler } from "hono";

import { makeLocals } from "stack54/locals";
import { Options } from "stack54/types";
import { getLocals } from "./locals.js";

export const render = (
  fn: (
    name: string,
    props: object,
    opts: Options
  ) => Promise<string | ReadableStream>
): MiddlewareHandler => {
  return async (ctx, next) => {
    ctx.setRenderer((...args) => {
      const [name, props, opts] = args as any;

      const user_context = opts?.context as Map<string, unknown> | undefined;

      const locals = makeLocals(getLocals(ctx));

      const context = new Map([
        ...(user_context?.entries() ?? []),
        ...locals.entries(),
      ]);

      // @ts-ignore
      return ctx.html(fn(name, props, { context }));
    });

    await next();
  };
};
