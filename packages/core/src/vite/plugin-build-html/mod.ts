import fs from "node:fs";
import path from "node:path";

import fse from "fs-extra";

import type { Plugin, ResolvedConfig, Rollup } from "vite";
import * as vite from "vite";

import color from "kleur";

import { is_view, parse_request } from "../utils/template.js";

/**
 * Heuristic to determine if a component needs processing of client assets.
 * Matches any non-commented script module or link[rel=stylesheet] tag
 *
 * Most of it was generated by ChatGPT, but some parts had to be filled-in for it to work correctly
 */
// const regex =
//   /(?![^]*?<!--\s*)\s*<(script\s+type\s*=\s*['"]module['"]\s+src\s*=\s*['"]\.\S*['"])|(link\s+rel\s*=\s*['"]stylesheet['"]\s+href\s*=\s*['"]\.\S*['"])\s*(?![^]*?-->)/;

const assetRegex =
  /(<\s*(script|link)[^>]*\s(src\s*=\s*"[.]\/[^"]*")[^>]*>|<\s*(script|link)[^>]*\s(src\s*=\s*'[.]\/[^']*')[^>]*>)/gi;

const VITE_HTML_PLACEHOLDER = "<div data-obfuscation-placeholder></div>";

const obfuscate: Plugin = {
  name: "plugin-obfuscate",
  /**
   * we need to execute this before any vite html parser sees it and throws an error because of the
   * svelte script at the beginning of the markup, to trick it into accepting the markup as valid HTML
   */
  transformIndexHtml: {
    order: "pre",
    handler(html) {
      return `${VITE_HTML_PLACEHOLDER}\n${html}`;
    },
  },
};

const deobfuscate: Plugin = {
  enforce: "post",
  name: "plugin-deobfuscate",
  transformIndexHtml(html) {
    return html.replace(`${VITE_HTML_PLACEHOLDER}\n`, "");
  },
};

const build_cache = new Map<string, string>();

function is_local_path(path: string) {
  return (
    !path.startsWith("http:") &&
    !path.startsWith("https:") &&
    !path.startsWith("//")
  );
}

/**
 * Builds svelte components as HTML files, processes images, stylesheets, script tags
 * and other asset types
 */
export function plugin_buildHTML({
  cwd,
  outDir,
}: {
  cwd: string;
  outDir: string;
}): Plugin {
  const build_dir = path.join(outDir, "build");
  const generated_dir = path.join(build_dir, "generated");

  let plugins: Plugin[];
  let resolved_vite_config: ResolvedConfig;

  return {
    apply: "build",
    name: "mpa:build-html",

    buildStart() {
      const publicDirectory = resolved_vite_config.publicDir;
      const assets = resolved_vite_config.build.assetsDir;
      const dir = path.join(publicDirectory, assets);
      build_cache.clear();
      fse.remove(dir);
    },

    writeBundle() {
      const publicDirectory = resolved_vite_config.publicDir;
      const assets = resolved_vite_config.build.assetsDir;
      const src = path.join(build_dir, assets);
      const dest = path.join(publicDirectory, assets);
      if (fs.existsSync(src)) fse.moveSync(src, dest);
      fse.remove(build_dir);

      console.log(
        `${color.green(`✓ Copied build assets to ${dest.replace(cwd, "")}`)}`
      );
    },

    configResolved(config) {
      resolved_vite_config = config;

      /** we want to re-use plugins defined in the user's vite config, but doing so causes
       * the internal vite plugins to throw error when we try to perform the secondary build to process
       * html assets.
       *
       * So we need to remove them, not sure what are the side effects of doing that. But there should be no
       * issue given the secondary build has the same plugins applied by vite.
       *
       * We also remove our plugins to avoid an infinite loop of secondary builds and unnecessary initializations.
       */
      plugins = config.plugins.filter(
        (_) =>
          _.name != "mpa:setup" &&
          _.name != "mpa:build-html" &&
          _.name != "mpa:dev-server" &&
          _.name != "mpa:env-server" &&
          _.name != "mpa:typed-template" &&
          _.name != "mpa:preview-server" &&
          _.name != "vite:reporter" &&
          _.name != "vite:build-html" &&
          _.name != "vite:build-import-analysis"
      );
    },

    transform: {
      order: "pre",
      async handler(_, id) {
        const { filename } = parse_request(id);

        if (!is_view(filename)) return;

        if (build_cache.has(id)) {
          return build_cache.get(id);
        }

        // const has_asset = _.match(assetRegex);

        // if (!has_asset) return;

        const { dir, name } = path.parse(filename);

        const tmp_name = name + ".html";

        const tmp_dir = path.join(generated_dir, dir.replace(cwd, ""));

        const tmp_path = path.join(tmp_dir, tmp_name);

        fse.ensureDirSync(tmp_dir);
        fse.copyFileSync(filename, tmp_path);

        const build_import_analysis = resolved_vite_config.plugins.find(
          (p) => p.name == "vite:build-import-analysis"
        );

        // resolve imports from the original file location
        const resolve: Plugin = {
          name: "plugin-resolve",
          load: {
            order: "pre",
            handler(id, options) {
              const load = build_import_analysis?.load;
              const fn = typeof load == "function" ? load : load?.handler;
              return fn?.call(this, id, options);
            },
          },
          resolveId: {
            order: "pre",
            async handler(source, importer) {
              if (!is_local_path(source)) return;
              const resolved = path.resolve(dir, source);
              if (importer && fs.existsSync(resolved)) return resolved;
            },
          },
        };

        /**
         * We need to strip inline styles, most especially the svelte component inline style tag.
         * Because the below vite HTML processing will try to processor all inline style tags, including
         * the svelte component style tag which produces the wrong output i.e
         *
         * <style>export default ""</style>
         *
         * which is the wrong behavior, so we remove all inline styles and put them back after vite processing.
         */
        const replacements: Array<[string, string]> = [];

        const strip_style: Plugin = {
          name: "internal:strip-style",
          transformIndexHtml: {
            order: "pre",
            handler(code) {
              /**
               * matches only uncommented style tags
               *
               * To avoid adding commenting already commented tags, which is invalid HTML, which will
               * cause the vite html analyzer to halt with an error
               */
              const regex =
                /<style\b[^>]*>(?:(?!<!--)[\s\S])*?<\/style>(?![\s\S]*?-->)/gi;

              code = code.replace(regex, (s) => {
                const p = `<!--${Math.random()}${Math.random()}-->`;
                replacements.push([p, s]);
                return p;
              });

              return code;
            },
          },
        };

        const restore_style: Plugin = {
          name: "internal:restore-style",
          transformIndexHtml: {
            order: "post",
            handler(code) {
              if (replacements.length) {
                replacements.forEach(([p, s]) => {
                  code = code.replace(p, s);
                });
              }

              return code;
            },
          },
        };

        const { build } = resolved_vite_config;

        const result = await vite.build({
          configFile: false,
          clearScreen: false,
          logLevel: "silent",
          css: resolved_vite_config.css,
          json: resolved_vite_config.json,
          base: resolved_vite_config.base,
          define: resolved_vite_config.define,
          esbuild: resolved_vite_config.esbuild,
          optimizeDeps: resolved_vite_config.optimizeDeps,
          envPrefix: resolved_vite_config.envPrefix as string[],
          // We apply obfuscation to prevent vite:build-html plugin from freaking out
          // when it sees a svelte script at the beginning of the html file
          plugins: [
            ...plugins,
            resolve,
            strip_style,
            restore_style,
            obfuscate,
            deobfuscate,
          ],
          build: {
            ssr: false,
            outDir: build_dir,
            emptyOutDir: false,
            copyPublicDir: false,
            minify: build.minify,
            cssMinify: build.cssMinify,
            cssTarget: build.cssTarget,
            cssCodeSplit: build.cssCodeSplit,
            modulePreload: build.modulePreload,
            rollupOptions: { input: tmp_path },
            assetsInlineLimit: build.assetsInlineLimit,
            dynamicImportVarsOptions: build.dynamicImportVarsOptions,
          },
        });

        const { output } = result as Rollup.RollupOutput;

        const module = output.find((_) => _.fileName == tmp_path);

        if (module?.type == "asset") {
          const code = module.source.toString();
          build_cache.set(id, code);
          return { code };
        }
      },
    },
  };
}
