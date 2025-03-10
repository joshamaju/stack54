import { existsSync } from "node:fs";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { Processed } from "svelte/compiler";
import * as compiler from "svelte/compiler";
import type { BaseNode, Element } from "svelte/types/compiler/interfaces";

import type { Plugin } from "vite";
import * as vite from "vite";

import { all, call, Operation } from "effection";
import MagicString from "magic-string";

import type { ResolvedConfig } from "../config/index.js";
import {
  run_html_post_transform,
  run_html_pre_transform,
} from "../integrations/hooks.js";
import { use_logger } from "../logger.js";

async function copy_dir(srcDir: string, destDir: string) {
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
      await copy_dir(srcFile, destFile);
    } else {
      await fs.copyFile(srcFile, destFile);
    }
  }
}

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

          if (name == "link" || name == "script") {
            assets.push(node_);
          }
        }
      });
    },
  });

  return assets;
}

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

  const logger = use_logger();

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
    assets.map((asset, i) => {
      return call(function* () {
        const code = s.slice(asset.start, asset.end);
        const filename = path.join(root, `${i}.html`);
        yield* call(() => fs.writeFile(filename, code));
        return [filename, asset] as const;
      });
    })
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

        if (existsSync(file)) return file;
      }
    },
  };

  const manifest_file = "vite-manifest.json";

  const inline_config: vite.InlineConfig = {
    logLevel: "silent",
    mode: "production",
    envPrefix: config.env.publicPrefix,
    // customLogger: vite_logger,
    plugins: [
      resolve,
      // obfuscate, deobfuscate
    ],
    build: {
      ssr: false,
      outDir: build,
      manifest: manifest_file,
      rollupOptions: {
        input: fragments.map(([k]) => k),
      },
    },
  };

  yield* call(() => vite.build(vite.mergeConfig(config.vite, inline_config)));

  const manifest = yield* call(() =>
    fs.readFile(path.join(build, manifest_file), "utf-8")
  );

  const contents = JSON.parse(manifest) as vite.Manifest;

  const values = Object.values(contents);

  yield* all(
    fragments.map(([filename, node]) => {
      return call(function* () {
        const entry = values.find((_) => _.src && filename.endsWith(_.src));

        if (entry) {
          const file = path.join(build, entry.src!);
          const code = yield* call(() => fs.readFile(file, "utf-8"));
          s.update(node.start, node.end, code);
        }
      });
    })
  );

  code = s.toString();

  code =
    config.integrations.length <= 0
      ? code
      : yield* call(() => run_html_post_transform(config, { code, filename }));

  const assets_dir = path.join(build, config.build.assetsDir);

  const has_assets = existsSync(assets_dir);

  if (has_assets) {
    yield* call(() =>
      copy_dir(assets_dir, path.join(outDir, config.build.assetsDir))
    );
  }

  return code;
}
