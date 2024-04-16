import fs from "node:fs";
import path from "node:path";

import fse from "fs-extra";

import type { Plugin, ResolvedConfig } from "vite";
import * as vite from "vite";

import color from "kleur";

import { parse } from "node-html-parser";

import { is_view, parse_request } from "../utils/template.js";

const script_regex = /<script(\s[^]*?)?(?:>([^]*?)<\/script>|\/>)/gim;
const style_regex = /<style(\s[^]*?)?(?:>([^]*?)<\/style>|\/>)/gim;
const module_regex = /type\s*=\s*["']module["']/i;

const build_cache = new Map<string, string>();

function is_local_path(path: string) {
  return (
    !path.startsWith("http:") &&
    !path.startsWith("https:") &&
    !path.startsWith("//")
  );
}

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

/**
 * Builds svelte components as HTML files, processes images, stylesheets, script tags
 * and other asset types
 */
export function plugin_build_html({
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
      async handler(code, id) {
        const { filename } = parse_request(id);

        if (code.length <= 0 || !is_view(filename)) return;

        if (build_cache.has(id)) {
          return build_cache.get(id);
        }

        const { dir, name } = path.parse(filename);

        const tmp_dir = path.join(generated_dir, dir.replace(cwd, ""));

        const tmp_path = path.join(tmp_dir, name + ".html");

        // tags that we need to remove temporarily
        const replacements: Array<[string, string]> = [];

        // tags that we'll need to move back to their original location
        const movers: Array<string> = [];

        /**
         * we assume none module script tags are svelte component instance scripts - which should be only one
         * But this might pick up normal non-module inline script tags, but we're not worried about those given
         * there's no need to process them here
         */
        code = code.replace(script_regex, (match, attrs) => {
          const is_module = module_regex.test(attrs);

          if (is_module) {
            /**
             * vite moves script module tags from the body to the head, but it moves them
             * to the top if the document has no head. Which will be the case if you have
             * a component with a script tag i.e
             *
             * ```html
             * <svelte:head>
             *  <script type="module" src="./app.ts"></script>
             * </svelte:head>
             *
             * which breaks the svelte build because you can only have one top-level script.
             * so we need to wrap them in html with head tag to make vite keep them in place,
             * which we then clean up at the end of the build.
             * ```
             */
            const id = `${Math.random()}${Math.random()}`;
            movers.push(id);
            return `<html data-move="${id}"><head>${match}</head></html>`;
          }

          const p = `<!--${Math.random()}${Math.random()}-->`;
          replacements.push([p, match]);
          return p;
        });

        const template = code.replace(style_regex, (match) => {
          const p = `<!--${Math.random()}${Math.random()}-->`;
          replacements.push([p, match]);
          return p;
        });

        fse.ensureDirSync(tmp_dir);
        fse.writeFileSync(tmp_path, template);

        const build_import_analysis = resolved_vite_config.plugins.find(
          (p) => p.name == "vite:build-import-analysis"
        );

        const { transform, ...build_import_analysis_plugin } =
          build_import_analysis ?? {};

        // resolve imports from the original file location
        const resolve: Plugin = {
          name: "plugin-resolve",
          ...build_import_analysis_plugin,
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
            handler(source) {
              if (!is_local_path(source)) return;
              const resolved = path.resolve(dir, source);
              if (fs.existsSync(resolved)) return resolved;
            },
          },
        };

        const { build } = resolved_vite_config;

        const output = await vite.build({
          configFile: false,
          clearScreen: false,
          logLevel: "silent",
          mode: "production",
          css: resolved_vite_config.css,
          json: resolved_vite_config.json,
          base: resolved_vite_config.base,
          define: resolved_vite_config.define,
          esbuild: resolved_vite_config.esbuild,
          optimizeDeps: resolved_vite_config.optimizeDeps,
          envPrefix: resolved_vite_config.envPrefix as string[],
          plugins: [...plugins, resolve, obfuscate, deobfuscate],
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

        const build_output = Array.isArray(output) ? output : [output];

        const outputs = build_output.flatMap((_) =>
          "output" in _ ? _.output : []
        );

        const module = outputs.find((_) => _.fileName == tmp_path);

        if (module?.type == "asset") {
          let code = module.source.toString();

          if (replacements.length) {
            replacements.forEach(([p, s]) => {
              code = code.replace(p, s);
            });
          }

          const node = parse(code);

          movers.forEach((move) => {
            const doc = node.querySelector(`[data-move="${move}"]`);
            const nodes = doc?.querySelectorAll("head > *");

            if (doc && nodes) {
              code = code.replace(
                doc.toString(),
                nodes.map((_) => _.toString()).join("")
              );
            }
          });

          build_cache.set(id, code);

          return { code };
        }
      },
    },
  };
}
