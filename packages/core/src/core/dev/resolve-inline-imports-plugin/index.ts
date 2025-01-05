import * as url from "node:url";
import type { Plugin } from "vite";
import { RESOLVER_PREFIX } from "../attach-full-path/index.js";

export function resolve_inline_imports_plugin(): Plugin {
  return {
    name: "stack54:resolve-inline-imports",
    async resolveId(source) {
      if (source.startsWith(RESOLVER_PREFIX)) {
        const id = source.replace(RESOLVER_PREFIX, "");

        const parsed = url.parse(id);
        const query = new url.URLSearchParams(parsed.query ?? "");

        const file = query.get("file")?.trim();

        query.delete("file");

        if (file) {
          const s = query.toString();
          const id = `${parsed.pathname}${s.trim() == "" ? "" : `?${s}`}`;
          return this.resolve(id, file, { skipSelf: true });
        }
      }
    },
  };
}
