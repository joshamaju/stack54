import MagicString from "magic-string";
import { Plugin, ResolvedConfig } from "vite";
import { is_view, parse_request } from "../utils/template.js";

const hot_reload_markup = /<\s*HotReload\s*\/\s*>/;

const hot_reload_script = '<script type="module" src="@vite/client"></script>';

export function plugin_hot_reload(): Plugin {
  let vite_config: ResolvedConfig;

  return {
    name: "stack54:hot-reload",
    configResolved(config) {
      vite_config = config;
    },
    transform: {
      order: "pre",
      handler(code, id) {
        const { filename } = parse_request(id);

        if (is_view(filename) && vite_config.mode == "development") {
          const s = new MagicString(code);
          s.replace(hot_reload_markup, hot_reload_script);
          return { code: s.toString(), map: s.generateMap() };
        }
      },
    },
  };
}
