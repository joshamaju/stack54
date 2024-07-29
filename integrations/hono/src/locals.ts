import { Context } from "hono";
import { Locals } from "stack54/locals";

const key = "$$local";

// For getting locals inside server handlers
export function getLocals(ctx: Context): Locals;
export function getLocals(ctx: Context, name: string): unknown;
export function getLocals(ctx: Context, name?: string) {
  const locals = ctx.get(key) ?? {};
  return name ? locals[name] : locals;
}

export function setLocals<T extends Locals, K extends keyof T>(
  ctx: Context,
  name: K,
  value: T[K]
): void;
export function setLocals(ctx: Context, name: Partial<Locals>): void;
export function setLocals<T extends Locals, K extends keyof T>(
  ctx: Context,
  name: K | Partial<T>,
  value?: T[K]
): void {
  const locals = (ctx.get(key) ?? {}) as Locals;

  ctx.set(
    key,
    typeof name == "object"
      ? { ...locals, ...name }
      : { ...locals, [name]: value }
  );
}
