import { getContext } from "svelte";

export interface Locals {}

export const key = "$$locals";

export const makeLocals = (locals: Locals) => new Map([[key, locals]]);

export function getLocals(): Locals;
export function getLocals<T>(name?: string): T;
export function getLocals(name?: string) {
  const locals = getContext(key) as Locals;
  return name ? (locals as any)[name] : locals;
}
