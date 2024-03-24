import type { Context, MiddlewareHandler } from "hono";
import { makeFactory } from "../render.js";

const key = "$$render";

export const view = (fn: ReturnType<typeof makeFactory>): MiddlewareHandler =>
  async function view(ctx, next) {
    ctx.set(key, (...args: Parameters<typeof fn>) => fn(...args));
    await next();
  };

export const getRenderFn = (ctx: Context) => {
  return ctx.get(key) as ReturnType<typeof makeFactory>;
};
