import { getContext } from "svelte";

export interface Locals {}

export const key = "$$locals";

const make_locals = (locals: Locals) => new Map([[key, locals]]);

function get_locals(): Locals;
function get_locals<T>(name?: string): T;
function get_locals(name?: string) {
  const locals = getContext(key) as Locals;
  return name ? (locals as any)[name] : locals;
}

export { get_locals as getLocals, make_locals as makeLocals };
