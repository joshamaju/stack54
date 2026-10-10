import { encode } from "../../data.js";
import type { Chunk } from "./types.js";

export function isPromise(value: any): value is Promise<any> {
  return (
    !!value &&
    (typeof value === "object" || typeof value === "function") &&
    typeof value.then === "function"
  );
}

/** Shared client bootstrap: one global swap function serves all deferred
 * boundaries, keeping the streamed markup small.
 */
export const swap_script = `
  <script data-await-swap-script>
    window.__AWAIT_SWAP__ = function (id) {
    var script = document.querySelector('[data-await-swap-init-script="' + id + '"]')
    var template = document.querySelector('[data-await="' + id + '"]');
    var fallback = document.querySelector('[data-await-fallback="' + id + '"]');
    fallback.replaceWith(template.content);
    template.remove();
    script.remove();
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    var patcher = document.querySelector('[data-await-swap-script]');
    patcher.remove();
  })
  </script>
  `;

export const renderFallback = ({ id, content }: Chunk) => {
  /** display: contents preserves the fallback's layout while giving each
   * deferred boundary a stable DOM node to replace after resolution.
   */
  return `<div style="display: contents;" data-await-fallback="${id}">${content}</div>`;
};

export const renderChunk = ({ id, name, value, content }: Chunk) => {
  /** Pair the resolved template with its boundary ID; deferred named data is
   * serialized separately for client-side hydration.
   */
  return `
  <template data-await="${id}">${content}</template>
  ${name ? encode(value as object, { id: `deferred:${name}` }) : ""}
  <script data-await-swap-init-script="${id}">window.__AWAIT_SWAP__(${id});</script>
  `;
};
