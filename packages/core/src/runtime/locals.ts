import { getContext } from "svelte";

export const key = "$$local";

export function makeLocals(locals: App.Locals) {
  const context = new Map([[key, locals]]);
  return context;
}

export function getLocals(): App.Locals;
export function getLocals<T>(name?: string): T;
export function getLocals(name?: string) {
  const locals = getContext(key) as App.Locals;
  // @ts-expect-error
  return name ? locals[name] : locals;
}
