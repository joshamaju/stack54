import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { Processed } from "svelte/compiler";
import * as compiler from "svelte/compiler";
import type { BaseNode, Element } from "svelte/types/compiler/interfaces";

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
import { ManifestEntry } from "../types.js";
import { copy } from "../utils/filesystem.js";

function collect_assets(code: string, filename: string): Array<Element> {
  type Visitor = (node: BaseNode) => BaseNode;

  const walk = (node: BaseNode, visitor: Visitor): BaseNode => {
    if (node.children) {
      node.children = node.children.map((_) => walk(_, visitor));
    }

    return visitor(node);
  };

  const assets: Array<Element> = [];

  const ast = compiler.parse(code, { filename });

  // @ts-expect-error
  compiler.walk(ast.html, {
    enter(node) {
      // @ts-expect-error
      walk(node, (node) => {
        if (node.type == "Element") {
          const node_: Element = node as any;
          const name = node_.name;

          if (name == "link" || name == "style" || name == "script") {
            assets.push(node_);
          }
        }
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
 *      // bundled inline JS
 *   </script>`
 *
 * Which we then back-port into the original file. Which makes the final output:
 *
 * ```html
 * <html>
 *    <head>
 *        <link rel="stylesheet" href="/assets/style-[hash].css" />
 *    </head>
 *    <body>
 *        <script src="/assets/script-[hash].js" type="module"></script>
 *
 *        <script type="module">
 *            // bundled inline JS
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
}): Operation<{ code: string; manifest: ManifestEntry[] } | null> {
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

  let output_bundle: vite.Rollup.OutputBundle | undefined;

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
      manifest: true,
      modulePreload: false,
      assetsDir: config.build.assetsDir,
      rollupOptions: {
        input: fragments.map(([k]) => k),
      },
    },
  };

  yield* call(() => vite.build(vite.mergeConfig(config.vite, inline_config)));

  const manifest_file = path.join(build, ".vite/manifest.json");

  const vite_manifest: vite.Manifest = yield* call(async () => {
    const content = await fs.readFile(manifest_file, "utf-8");
    return JSON.parse(content);
  });

  const vite_manifest_entries = Object.values(vite_manifest).map(
    (_) => `/${_.file}`
  );

  const move_assets = yield* spawn(function* () {
    const dir = path.join(build, config.build.assetsDir);

    try {
      yield* call(() => copy(dir, path.join(outDir, config.build.assetsDir)));
    } catch (error) {
      // no assets
    }
  });

  const output_files = [...Object.keys(output_bundle ?? {})];

  const manifest: ManifestEntry[] = [];

  /**
   * finds the output file for each asset (i.e link, script) fragment
   * and updates the attributes of the asset to match the output file
   */
  for (const [filename, { id, node }] of fragments) {
    const file = output_files.find((k) =>
      k.endsWith(filename.replace(dir, ""))
    );

    if (file) {
      const bundle = output_bundle?.[file];

      if (bundle?.type == "asset") {
        const $output = parseHTML(bundle.source.toString());
        const $source = parseHTML(s.slice(node.start, node.end));

        const source = $source(node.name);
        const output = $output(`${node.name}[${ID_ATTR}="${id}"]`);

        const source_attrs = source.attr();

        for (const name in source_attrs) {
          const value = output.attr(name);

          if (value && vite_manifest_entries.includes(value)) {
            manifest.push({ file: value, src: source_attrs[name] });
          }

          // keep whatever value exists in the source file if the output
          // doesn't have it or wasn't generated
          if (!value) output.attr(name, source_attrs[name]);
        }

        s.update(node.start, node.end, $output.html());
      }
    }
  }

  code = s.toString();

  code =
    config.integrations.length <= 0
      ? code
      : yield* call(() => run_html_post_transform(config, { code, filename }));

  yield* move_assets;

  return { code, manifest };
}
