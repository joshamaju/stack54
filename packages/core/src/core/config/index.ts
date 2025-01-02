import { existsSync } from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

import type { Arrayable } from "@sveltejs/vite-plugin-svelte";
import type { CompileOptions, PreprocessorGroup } from "svelte/compiler";
import type { ViteDevServer, UserConfig as ViteUserConfig } from "vite";
import z, { ZodError } from "zod";

import { expand } from "../utils/filesystem.js";
import { get_svelte_config } from "../utils/vite.js";

type Maybe<T> = T | Promise<T>;

type Transformer = (code: string, filename: string) => Maybe<void | string>;

type Command = { command: "build" | "serve" };

interface Hooks {
  buildEnd: () => Maybe<void>;
  buildStart: () => Maybe<void>;
  configResolved: (config: ResolvedConfig) => Maybe<void>;
  config: (config: UserConfig, env: Command) => Maybe<object | void>;
  transform: Transformer | { handle: Transformer; order: "pre" | "post" };
  configureServer: (server: ViteDevServer) => Maybe<void> | (() => Maybe<void>);
}

export interface Integration extends Partial<Hooks> {
  name: string;
}

export const userConfigSchema = z.object({
  staticDir: z.string().default("static"),
  vite: z.custom<ViteUserConfig>().default({}),
  entry: z.string().default("src/entry.{js,ts,mjs,mts}"),
  integrations: z.array(z.custom<Integration>()).default([]),
  views: z.array(z.string()).default(["src/views/**/*.svelte"]),
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
});

export type UserConfig = z.input<typeof userConfigSchema>;
export type ResolvedConfig = z.infer<typeof userConfigSchema>;

export async function load(cwd = process.cwd()): Promise<UserConfig | null> {
  const config_file = path.join(cwd, "stack.config.js");

  if (!existsSync(config_file)) {
    return null;
  }

  const config = await import(
    `${pathToFileURL(config_file).href}?ts=${Date.now()}`
  );

  return config.default;
}

export class InvalidConfig {
  constructor(public cause: ZodError<UserConfig>) {}
}

export function parse(config: UserConfig | null = {}) {
  const result = userConfigSchema.safeParse(config);
  if (result.success) return result.data;
  throw new InvalidConfig(result.error);
}

export async function preprocess(
  config: ResolvedConfig,
  { cwd }: { cwd: string }
) {
  const [views, entry] = await Promise.all([
    expand([...new Set(config.views)], { cwd, absolute: true }),
    expand(config.entry, { cwd }),
  ]);

  return {
    ...config,
    views,
    entry: entry[0],
    svelte: get_svelte_config(config),
  };
}
