import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";

import type { Arrayable } from "@sveltejs/vite-plugin-svelte";
import { glob } from "glob";
import type { CompileOptions, PreprocessorGroup } from "svelte/compiler";
import type {
  PreviewServer,
  ViteDevServer,
  UserConfig as ViteUserConfig,
} from "vite";
import z, { ZodError } from "zod";

import type { MaybeAwait } from "../types.js";

export const userConfigSchema = z.object({
  staticDir: z.string().default("static"),
  vite: z.custom<ViteUserConfig>().default({}),
  entry: z.string().default("src/entry.{js,ts,mjs,mts}"),
  views: z.union([z.string(), z.array(z.string())]).default(["**/*.svelte"]),
  build: z
    .object({
      minify: z.boolean().default(true),
      outDir: z.string().default("dist"),
      assetPrefix: z.string().default("/"),
      assetsDir: z.string().default("assets"),
    })
    .default({}),
  env: z
    .object({
      dir: z.string().optional(),
      publicPrefix: z.string().default("PUBLIC_"),
    })
    .default({}),
  svelte: z
    .object({
      emitCss: z.boolean().default(false),
      extensions: z.array(z.string()).default([".svelte"]),
      preprocess: z.custom<Arrayable<PreprocessorGroup>>().optional(),
      compilerOptions: z
        .custom<Omit<CompileOptions, "filename" | "format" | "generate">>()
        .optional()
        .default({ hydratable: true }),
    })
    .default({}),
  integrations: z
    .array(
      z.object({
        name: z.string(),
        configResolved: z
          .custom<(config: any) => MaybeAwait<void>>()
          .optional(),
        config: z
          .custom<(config: any) => MaybeAwait<object | undefined>>()
          .optional(),
        configureServer: z
          .custom<(server: ViteDevServer) => void | (() => void)>()
          .optional(),
        configurePreviewServer: z
          .custom<(server: PreviewServer) => void | (() => void)>()
          .optional(),
      })
    )
    .default([]),
});

export type UserConfig = z.input<typeof userConfigSchema>;
export type ResolvedConfig = z.infer<typeof userConfigSchema>;

export type Integration = ResolvedConfig["integrations"][number];

export async function load(cwd = process.cwd()): Promise<UserConfig | null> {
  const config_file = path.join(cwd, "stack.config.js");

  if (!fs.existsSync(config_file)) {
    return null;
  }

  const config = await import(
    `${url.pathToFileURL(config_file).href}?ts=${Date.now()}`
  );

  return config.default;
}

export class InvalidConfig {
  readonly _tag = "InvalidConfig";
  constructor(public cause: ZodError<UserConfig>) {}
}

export async function parse(config: UserConfig) {
  const result = userConfigSchema.safeParse(config);
  if (result.success) return result.data;
  return new InvalidConfig(result.error);
}

export async function preprocess(
  config: ResolvedConfig,
  { cwd }: { cwd: string }
) {
  const [views, entry] = await Promise.all([
    glob(config.views, { cwd, absolute: true }),
    glob(config.entry, { cwd }),
  ]);

  return { ...config, views, entry: entry[0] };
}
