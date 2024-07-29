import MagicString from "magic-string";
import { Plugin, ResolvedConfig } from "vite";
import { is_view, parse_id } from "../../utils/view.js";

const hot_reload_markup = /<\s*HotReload\s*\/\s*>/;

const hot_reload_script = '<script type="module" src="@vite/client"></script>';

export function hotReloadPlugin(): Plugin {
  let config: ResolvedConfig;

  return {
    name: "stack54:hot-reload",
    configResolved(conf) {
      config = conf;
    },
    transform: {
      order: "pre",
      handler(code, id) {
        if (is_view(parse_id(id).filename) && config.mode == "development") {
          const s = new MagicString(code);
          s.replace(hot_reload_markup, hot_reload_script);
          return { code: s.toString(), map: s.generateMap() };
        }
      },
    },
  };
}
