import path from "node:path";
import MagicString from "magic-string";
import { Plugin, ResolvedConfig as ViteResolvedConfig } from "vite";
import { parse_id } from "../../utils/view.js";
import { Integration, ResolvedConfig } from "../../config/index.js";

const markup = /<\s*LiveReload\s*\/\s*>/;

const script = '<script type="module" src="@vite/client"></script>';

export function live_reload_plugin(): Integration {
  let config: ResolvedConfig;
  let vite_config: ViteResolvedConfig;

  const vite_plugin: Plugin = {
    apply: "serve",
    name: "stack54:live-reload",
    configResolved(conf) {
      vite_config = conf;
    },
    transform: {
      order: "pre",
      handler(code, id) {
        const is_view = config.svelte.extensions.includes(
          path.extname(parse_id(id).filename)
        );

        if (is_view && vite_config.mode == "development") {
          const s = new MagicString(code);
          s.replace(markup, script);
          return { code: s.toString(), map: s.generateMap() };
        }
      },
    },
  };

  return {
    name: "stack54:live-reload",
    config() {
      return { vite: { plugins: [vite_plugin] } };
    },
    configResolved(c) {
      config = c;
    },
  };
}
