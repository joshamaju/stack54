import { getContext } from "svelte";

export interface Locals {}

export const key = "$$local";

export function makeLocals(locals: Locals) {
  const context = new Map([[key, locals]]);
  return context;
}

export function getLocals(): Locals;
export function getLocals<T>(name?: string): T;
export function getLocals(name?: string) {
  const locals = getContext(key) as Locals;
  return name ? (locals as any)[name] : locals;
}
