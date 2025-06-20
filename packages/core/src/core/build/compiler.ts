import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { Processed } from "svelte/compiler";
import * as compiler from "svelte/compiler";
import type { AST } from "svelte/compiler";
import { walk } from "estree-walker";

import type { Plugin } from "vite";
import * as vite from "vite";

import * as cheerio from "cheerio";
import { all, call, Operation, spawn } from "effection";
import MagicString from "magic-string";

import type { ResolvedConfig } from "../config/index.js";
import {
  run_html_post_transform,
  run_html_pre_transform,
} from "../integrations/hooks.js";
import { visit } from "../utils/walk.js";

async function copy(srcDir: string, destDir: string) {
  await fs.mkdir(destDir, { recursive: true });

  const files = await fs.readdir(srcDir);

  for (const file of files) {
    const srcFile = path.resolve(srcDir, file);

    if (srcFile === destDir) {
      continue;
    }

    const destFile = path.resolve(destDir, file);
    const stat = await fs.stat(srcFile);

    if (stat.isDirectory()) {
      await copy(srcFile, destFile);
    } else {
      await fs.copyFile(srcFile, destFile);
    }
  }
}

function collect_assets(
  code: string,
  filename: string
): Array<AST.ElementLike> {
  const assets: Array<AST.ElementLike> = [];

  const ast = compiler.parse(code, { filename });

  walk(ast.html, {
    enter(node) {
      visit(node, (node) => {
        if (node.type == "Element") {
          const node_: AST.ElementLike = node as any;
          const name = node_.name;

          if (name == "link" || name == "style" || name == "script") {
            assets.push(node_);
          }
        }

        return node;
      });
    },
  });

  return assets;
}

function parseHTML(html: string) {
  return cheerio.load(html, undefined, false);
}

const ID_ATTR = "data-stack54";

/**
 * # How this works
 *
 * We take a [filename].svelte, Grabs all the assets i.e
 * <link rel="stylesheet" href="..." />, <script src="..." type="module"></script>
 *
 * For example:
 *
 * ```html
 * <html>
 *    <head>
 *        <link rel="stylesheet" href="./style.css" />
 *    </head>
 *    <body>
 *        <script src="./script.ts" type="module"></script>
 *
 *        <script type="module">
 *            import module from "node_modules"
 *        </script>
 *    </body>
 * </html>
 * ```
 *
 * We end up with an array of:
 *
 * - `<link rel="stylesheet" href="./style.css" />`
 * - `<script src="./script.ts" type="module"></script>`
 * - `<script type="module">
 *      import module from "node_modules"
 *   </script>`
 *
 * process them into:
 *
 * - `<link rel="stylesheet" href="./style-[hash].css" />`
 * - `<script src="./script-[hash].js" type="module"></script>`
 * - `<script type="module">
 *      // bundled JS
 *   </script>`
 *
 * Which we then back-port into the original file. Which makes the final output:
 *
 * ```html
 * <html>
 *    <head>
 *        <link rel="stylesheet" href="./style-[hash].css" />
 *    </head>
 *    <body>
 *        <script src="./script-[hash].js" type="module"></script>
 *
 *        <script type="module">
 *            // bundled JS
 *        </script>
 *    </body>
 * </html>
 * ```
 */
export function* compile({
  dir,
  code,
  outDir,
  config,
  filename,
}: {
  dir: string;
  code: string;
  outDir: string;
  filename: string;
  config: ResolvedConfig;
}): Operation<string | null> {
  const p = path.parse(filename);

  const name = path.join(p.dir, p.name).replaceAll(path.sep, "_");

  const root = path.join(dir, name);
  const build = path.join(root, "build");

  const preprocessors = config.svelte.preprocess ?? [];

  const processed: Processed = yield* call(() =>
    compiler.preprocess(code, preprocessors, { filename })
  );

  code =
    config.integrations.length <= 0
      ? processed.code
      : yield* call(() =>
          run_html_pre_transform(config, { code: processed.code, filename })
        );

  const assets = collect_assets(code, filename);

  // skip views with no client assets to process
  if (assets.length <= 0) {
    return null;
  }

  yield* call(() => fs.mkdir(root, { recursive: true }));

  const s = new MagicString(code);

  const fragments = yield* all(
    assets.map((node, i) => {
      return call(function* () {
        const id = crypto.randomUUID();
        const code = s.slice(node.start, node.end);
        const filename = path.join(root, `${i}.html`);
        yield* call(() => fs.writeFile(filename, code));
        return [filename, { id, code, node }] as const;
      });
    })
  );

  let output_bundle: vite.Rollup.OutputBundle | null = null;

  const collect_bundle: Plugin = {
    name: "stack54:collect-bundle",
    writeBundle(_, bundle) {
      output_bundle = bundle;
    },
  };

  /**
   * resolves imports (including import aliases) from original file
   */
  const resolve: Plugin = {
    name: "stack54:resolver",
    async resolveId(source, importer) {
      if (importer) {
        const resolved = await this.resolve(source, filename);

        if (resolved) return resolved;

        const file = path.resolve(path.dirname(filename), source);

        return file;
      }
    },
  };

  const keyvalue = new Map(fragments);

  const stamp: Plugin = {
    name: "stack54:stamp",
    transformIndexHtml: {
      handler(html, ctx) {
        const frag = keyvalue.get(ctx.filename);

        if (frag) {
          const $ = parseHTML(html);
          $(frag.node.name).attr(ID_ATTR, frag.id);
          return $.html();
        }
      },
    },
  };

  const inline_config: vite.InlineConfig = {
    logLevel: "silent",
    mode: "production",
    envPrefix: config.env.publicPrefix,
    plugins: [resolve, stamp, collect_bundle],
    build: {
      ssr: false,
      outDir: build,
      modulePreload: false,
      rollupOptions: {
        input: fragments.map(([k]) => k),
      },
    },
  };

  yield* call(() => vite.build(vite.mergeConfig(config.vite, inline_config)));

  const move_assets = yield* spawn(function* () {
    const dir = path.join(build, config.build.assetsDir);

    try {
      yield* call(() => copy(dir, path.join(outDir, config.build.assetsDir)));
    } catch (error) {
      // no assets
    }
  });

  const output_files = [...Object.keys(output_bundle ?? {})];

  yield* all(
    fragments.map(([filename, { id, node }]) => {
      return call(function* () {
        const file = output_files.find((k) =>
          k.endsWith(filename.replace(dir, ""))
        );

        if (file) {
          const bundle = output_bundle?.[file];

          if (bundle?.type == "asset") {
            const $output = parseHTML(bundle.source.toString());
            const $original = parseHTML(s.slice(node.start, node.end));

            const original = $original(node.name);
            const output = $output(`${node.name}[${ID_ATTR}="${id}"]`);

            const original_attrs = original.attr();

            for (const name in original_attrs) {
              const value = output.attr(name);
              if (!value) output.attr(name, original_attrs[name]);
            }

            s.update(node.start, node.end, $output.html());
          }
        }
      });
    })
  );

  code = s.toString();

  code =
    config.integrations.length <= 0
      ? code
      : yield* call(() => run_html_post_transform(config, { code, filename }));

  yield* move_assets;

  return code;
}
