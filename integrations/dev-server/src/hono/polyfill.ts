import { installGlobals } from "@remix-run/node";

declare global {
  var Bun: object;
  var Deno: object;
}

export const shouldPolyfill =
  typeof Deno === "undefined" && typeof Bun === "undefined";

export function installPolyfills() {
  installGlobals();
}
