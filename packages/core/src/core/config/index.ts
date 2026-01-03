import { existsSync } from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

import type { Arrayable } from "@sveltejs/vite-plugin-svelte";
import { glob } from "glob";
import type { CompileOptions, PreprocessorGroup } from "svelte/compiler";
import type { ViteDevServer, UserConfig as ViteUserConfig } from "vite";
import z, { ZodError } from "zod";

import { get_svelte_config } from "../utils/vite.js";
import { Command, Manifest } from "../types.js";

type Maybe<T> = T | Promise<T>;

type Transformer = (code: string, filename: string) => Maybe<void | string>;

export type Env = { command: Command };

interface Hooks {
  buildStart: () => Maybe<void>;
  buildEnd: (manifest: Manifest) => Maybe<void>;
  configResolved: (config: ResolvedConfig) => Maybe<void>;
  config: (config: UserConfig, env: Env) => Maybe<object | void>;
  transform: Transformer | { handle: Transformer; order: "pre" | "post" };
  configureServer: (server: ViteDevServer) => Maybe<void> | (() => Maybe<void>);
}

export interface Integration extends Partial<Hooks> {
  name: string;
}

export const userConfigSchema = z.object({
  staticDir: z.string().default("static"),
  vite: z.custom<ViteUserConfig>().default({}),
  integrations: z
    .array(
      z.union([z.custom<Integration>(), z.promise(z.custom<Integration>())])
    )
    .default([]),
  views: z.array(z.string()).default(["src/views/**/*.svelte"]),
  entry: z
    .union([z.string(), z.array(z.string()), z.record(z.string(), z.string())])
    .default("src/entry.{js,ts,mjs,mts}"),
  build: z
    .object({
      minify: z.boolean().default(true),
      outDir: z.string().default("dist"),
      assetPrefix: z.string().default("/"),
      assetsDir: z.string().default("client"),
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
        .default({ hydratable: true }),
    })
    .default({}),
});

export type UserConfig = z.input<typeof userConfigSchema>;
export type ResolvedConfig = z.infer<typeof userConfigSchema>;

const DEFAULT_FILE = "stack.config.js";

export class InvalidConfig {
  constructor(public cause: ZodError<UserConfig>) {}
}

export class Config {
  #file: string;

  constructor(private cwd = process.cwd(), private file?: string) {
    this.#file = path.join(cwd, file ?? DEFAULT_FILE);
  }

  async load(): Promise<ResolvedConfig> {
    const file = this.#file;

    let config = {};

    if (existsSync(file)) {
      const url = pathToFileURL(file);
      const module = await import(`${url.href}?ts=${Date.now()}`);
      config = module.default;
    } else {
      if (this.file) throw `Config file ${this.file} not found`;
    }

    const result = userConfigSchema.safeParse(config);

    if (!result.success) throw new InvalidConfig(result.error);

    return result.data;
  }

  async resolve(config: ResolvedConfig) {
    const cwd = this.cwd;

    const { entry: file } = config;

    const entry =
      typeof file !== "string" && !Array.isArray(file)
        ? Object.fromEntries(
            await Promise.all(
              Object.entries(file).map(async ([k, v]) => {
                return [k, (await glob(v, { cwd }))[0]] as const;
              })
            )
          )
        : await glob(file, { cwd });

    return { ...config, entry, svelte: get_svelte_config(config) };
  }
}
