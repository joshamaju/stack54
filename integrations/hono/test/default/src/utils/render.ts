import type { MiddlewareHandler } from "hono";
import { renderToString } from "stack54/render/static";
import { key, makeLocals } from "stack54/locals";
import { resolver } from "./view";

declare module "hono" {
  interface ContextRenderer {
    (content: string, props?: object): Response;
  }
}

export const renderer = (): MiddlewareHandler => {
  return async (ctx, next) => {
    ctx.setRenderer((name, props) => {
      const locals = makeLocals(ctx.get(key));
      const context = new Map([...locals.entries()]);
      return ctx.html(renderToString(resolver(name), props, { context }));
    });

    await next();
  };
};
