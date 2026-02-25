import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { Processed } from "svelte/compiler";
import * as compiler from "svelte/compiler";
import type { BaseNode, Element } from "svelte/types/compiler/interfaces";

import type { Plugin } from "vite";
import * as vite from "vite";

import * as cheerio from "cheerio";
import { all, call, Operation } from "effection";
import MagicString from "magic-string";

import type { ResolvedConfig } from "../config/index.js";
import {
  run_html_post_transform,
  run_html_pre_transform,
} from "../integrations/hooks.js";
import { ManifestEntry } from "../types.js";
import { use_logger } from "../logger.js";

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

  const logger = yield* use_logger("client");

  console.log();
  logger.debug("Building", { filename });

  const preprocessors = config.svelte.preprocess ?? [];

  const processed: Processed = yield* call(() =>
    compiler.preprocess(code, preprocessors, { filename }),
  );

  code =
    config.integrations.length <= 0
      ? processed.code
      : yield* run_html_pre_transform(config, {
          code: processed.code,
          filename,
        });

  const assets = collect_assets(code, filename);

  // skip views with no client assets to process
  if (assets.length <= 0) {
    logger.debug("Skipping view. No asset");
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
    }),
  );

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
    plugins: [resolve, stamp],
    // cacheDir: cache_dir,
    build: {
      ssr: false,
      write: false,
      manifest: true,
      emptyOutDir: false,
      modulePreload: false,
      assetsDir: config.build.assetsDir,
      rollupOptions: {
        input: fragments.map(([k]) => k),
      },
    },
  };

  const { client } = config.environments;

  const vite_config = vite.mergeConfig(config.vite, client?.vite ?? {});

  const output = (yield* call(() =>
    vite.build(vite.mergeConfig(vite_config, inline_config)),
  )) as any;

  const output_bundle: vite.Rollup.OutputBundle = {};
  const result = Array.isArray(output) ? output : [output];

  for (const built of result) {
    const chunks = built?.output;

    if (Array.isArray(chunks)) {
      for (const chunk of chunks) {
        output_bundle[chunk.fileName] = chunk;
      }
    }
  }

  const manifest_asset = Object.values(output_bundle).find(
    (entry): entry is vite.Rollup.OutputAsset =>
      entry.type === "asset" &&
      (entry.fileName === ".vite/manifest.json" ||
        entry.fileName.endsWith("/manifest.json")),
  );

  const manifest_source = manifest_asset
    ? typeof manifest_asset.source === "string"
      ? manifest_asset.source
      : manifest_asset.source.toString()
    : "{}";

  const vite_manifest = JSON.parse(manifest_source) as vite.Manifest;

  const vite_manifest_entries = Object.values(vite_manifest).map(
    (_) => `/${_.file}`,
  );

  const assets_dir_prefix = `${config.build.assetsDir}/`;

  const generated_assets = Object.values(output_bundle).filter((entry) =>
    entry.fileName.startsWith(assets_dir_prefix),
  );

  if (generated_assets.length > 0) {
    const target_assets = path.join(outDir, config.build.assetsDir);

    yield* call(() => fs.mkdir(target_assets, { recursive: true }));

    yield* all(
      generated_assets.map((entry) =>
        call(async () => {
          const file = path.join(outDir, entry.fileName);
          await fs.mkdir(path.dirname(file), { recursive: true });

          if (entry.type === "chunk") {
            await fs.writeFile(file, entry.code);
          } else {
            await fs.writeFile(file, entry.source);
          }
        }),
      ),
    );
  } else {
    logger.debug("Build generated no asset");
  }

  const output_files = [...Object.keys(output_bundle ?? {})];

  const manifest: ManifestEntry[] = [];

  /**
   * finds the output file for each asset (i.e link, script) fragment
   * and updates the attributes of the asset to match the output file
   */
  for (const [filename, { id, node }] of fragments) {
    const file = output_files.find((k) =>
      k.endsWith(filename.replace(dir, "")),
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
      : yield* run_html_post_transform(config, { code, filename });

  return { code, manifest };
}
