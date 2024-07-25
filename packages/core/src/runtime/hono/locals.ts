import type { Context } from "hono";

export const key = "$$local";

export function setLocals<T extends App.Locals, K extends keyof T>(
  ctx: Context,
  name: K,
  value: T[K]
): void;
export function setLocals(ctx: Context, name: Partial<App.Locals>): void;
export function setLocals<T extends App.Locals, K extends keyof T>(
  ctx: Context,
  name: K | Partial<T>,
  value?: T[K]
): void {
  const locals = (ctx.get(key) ?? {}) as App.Locals;

  ctx.set(
    key,
    typeof name == "object"
      ? { ...locals, ...name }
      : { ...locals, [name]: value }
  );
}

// For getting locals inside server handlers
export function getLocals(ctx: Context): App.Locals;
export function getLocals(ctx: Context, name: string): unknown;
export function getLocals(ctx: Context, name?: string) {
  const locals = structuredClone(ctx.get(key) ?? {});
  return name ? locals[name] : locals;
}

export function makeLocalsContext(ctx: Context) {
  const locals = getLocals(ctx);
  const context = new Map([[key, locals]]);
  return context;
}
