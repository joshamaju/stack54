import type { Chunk } from "./types";

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
export const swapScript = `
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
  return `<div style="display: contents;" data-await-fallback="${id}">${content}</div>`;
};

export const renderChunk = ({ id, content }: Chunk) => {
  return `
  <template data-await="${id}">${content}</template>
  <script data-await-swap-init-script="${id}">window.__AWAIT_SWAP__(${id});</script>
  `;
};
