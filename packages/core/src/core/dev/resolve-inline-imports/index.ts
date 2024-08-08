import * as url from "node:url";
import type { Plugin } from "vite";
import { RESOLVER_PREFIX } from "../attach-full-path/index.js";

export function resolveInlineImportsPlugin(): Plugin {
  return {
    name: "stack54:resolve-inline-imports",
    resolveId(source) {
      if (source.startsWith(RESOLVER_PREFIX)) {
        const id = source.replace(RESOLVER_PREFIX, "");

        const parsed = url.parse(id);
        const query = new url.URLSearchParams(parsed.query ?? "");

        const file = query.get("file")?.trim();

        query.delete("file");

        if (file) {
          const id = `${parsed.pathname}?${query.toString()}`;
          console.log("\n", id);
          return this.resolve(id, file, { skipSelf: true });
        }
      }
    },
  };
}
