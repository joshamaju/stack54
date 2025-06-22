import type { Chunk } from "./types.js";

export function isPromise(value: any): value is Promise<any> {
  return (
    !!value &&
    (typeof value === "object" || typeof value === "function") &&
    typeof value.then === "function"
  );
}

// script to query for the fallback and replace with content.
// This is grouped into a global __AWAIT_SWAP__
// to reduce the payload size for multiple await boundaries.
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

export const renderChunk = ({ id, content }: Chunk) => {
  return `
  <template data-await="${id}">${content}</template>
  <script data-await-swap-init-script="${id}">window.__AWAIT_SWAP__(${id});</script>
  `;
};
