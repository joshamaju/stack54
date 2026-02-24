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
import { all, call, Operation, until, useAbortSignal } from "effection";
import { use_logger } from "../logger.js";

type Maybe<T> = T | Promise<T>;

type Transformer = (code: string, filename: string) => Maybe<void | string>;

export type Env = { command: Command };

const environment = z.union([z.literal("client"), z.literal("server")]);

type Environment = z.infer<typeof environment>;

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
  environment?: Environment;
}

export const baseConfigSchema = z.object({
  staticDir: z.string().default("static"),
  vite: z.custom<ViteUserConfig>().default({}),
  integrations: z
    .array(
      z.union([z.custom<Integration>(), z.promise(z.custom<Integration>())]),
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
      copyStaticDir: z.boolean().default(false),
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

const userConfigSchema = baseConfigSchema.extend({
  environments: z
    .record(
      environment,
      baseConfigSchema.pick({ vite: true, integrations: true }),
    )
    .default({}),
});

export type UserConfig = z.input<typeof userConfigSchema>;
export type ResolvedConfig = z.infer<typeof userConfigSchema>;

const DEFAULT_FILE = "stack.config.js";

export class InvalidConfig {
  constructor(public cause: ZodError<UserConfig>) {}
}

export function config_file(cwd: string, file?: string) {
  return path.join(cwd, file ?? DEFAULT_FILE);
}

export class Config {
  constructor(
    private cwd = process.cwd(),
    private file: string,
  ) {}

  *load(command: Command): Operation<ResolvedConfig> {
    const file = this.file;

    let config: UserConfig | ((command: Command) => UserConfig) = {};

    const logger = yield* use_logger();

    if (existsSync(file)) {
      const url = pathToFileURL(file);
      const module = yield* until(import(`${url.href}?ts=${Date.now()}`));
      config = module.default;
    } else {
      logger.warn(`Config file "${this.file}" not found. Using default config`);
    }

    const _config = typeof config == "function" ? config(command) : config;
    const result = userConfigSchema.safeParse(_config);

    if (!result.success) throw new InvalidConfig(result.error);

    return result.data;
  }

  *resolve(config: ResolvedConfig) {
    const cwd = this.cwd;

    const { entry: file } = config;

    const signal = yield* useAbortSignal();

    const entry =
      typeof file !== "string" && !Array.isArray(file)
        ? Object.fromEntries(
            yield* all(
              Object.entries(file).map(([k, v]) => {
                return call(function* () {
                  return [
                    k,
                    (yield* until(glob(v, { cwd, signal })))[0],
                  ] as const;
                });
              }),
            ),
          )
        : yield* (function* () {
            const files = yield* until(glob(file, { cwd, signal }));
            return Array.isArray(file) ? files : files[0];
          })();

    return { ...config, entry, svelte: get_svelte_config(config) };
  }
}
