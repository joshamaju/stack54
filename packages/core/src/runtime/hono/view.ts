import { getContext } from "svelte";
import * as Locals from "./locals.js";

// For getting locals inside templates/svelte components
export function getLocals(): App.Locals;
export function getLocals<T>(name?: string): T;
export function getLocals(name?: string) {
  const locals = getContext(Locals.key) as App.Locals;
  // @ts-expect-error
  return name ? locals[name] : locals;
}
