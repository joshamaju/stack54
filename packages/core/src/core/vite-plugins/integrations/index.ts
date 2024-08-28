import { Plugin } from "vite";
import { ResolvedConfig } from "../../config/index.js";
import {
  runPostTransform,
  runPreTransform
} from "../../integrations/hooks.js";

export function integrationsContainerPlugin(config: ResolvedConfig): Plugin {
  // let vite_config: ViteResolvedConfig;

  return {
    name: "stack54:integrations",
    // config(config, env) {
    //   console.log("integrations container", env);
    // },
    // configResolved(config) {
    //   vite_config = config;
    // },
    // async transform(code, id, options) {
    //   await runPostTransform(config, {
    //     code,
    //     filename: id,
    //     ssr: options?.ssr ?? true,
    //   });
    // },
    // async transformIndexHtml(code, { filename }) {
    //   await runPostTransform(config, { code, filename, ssr: false });
    // },
    async configureServer(server) {
      const callbacks = await Promise.all(
        config.integrations.map((plugin) => {
          return plugin.configureServer?.call(plugin, server);
        })
      );

      return () => {
        callbacks.forEach((fn) => fn?.());
      };
    },
  };
}

export function integrationsContainerPluginPre(config: ResolvedConfig): Plugin {
  return {
    name: "stack54:integrations:pre",
    transform: {
      order: "pre",
      handler(code, filename, { ssr = true } = {}) {
        return runPreTransform(config, { ssr, code, filename });
      },
    },
    // transformIndexHtml: {
    //   order: "pre",
    //   async handler(code, { filename }) {
    //     await runHtmlPreTransform(config, { code, filename });
    //   },
    // },
  };
}

export function integrationsContainerPluginPost(
  config: ResolvedConfig
): Plugin {
  return {
    name: "stack54:integrations:post",
    transform: {
      order: "post",
      handler(code, filename, { ssr = true } = {}) {
        return runPostTransform(config, { ssr, code, filename });
      },
    },
    // transformIndexHtml: {
    //   order: "post",
    //   handler(code, { filename }) {
    //     return runHtmlPostTransform(config, { code, filename });
    //   },
    // },
  };
}
