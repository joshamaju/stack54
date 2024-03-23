import z from "zod";
import { CompileOptions, PreprocessorGroup } from "svelte/compiler";

const typescript = z.object({
  views: z
    .object({
      includeExtension: z.boolean().default(false),
      ignore: z.union([z.string(), z.array(z.string())]).optional(),
    })
    .default({}),
});

const directories = z.object({
  templates: z.string().default("src/views"),
  controllers: z.string().default("src/controllers"),
});

export const options = z.object({
  typescript: typescript.default({}),
  directories: directories.default({}),
  server: z.optional(z.literal("standalone")),
  publicEnvPrefix: z.string().default("PUBLIC_"),
  extensions: z.array(z.string()).default([".svelte", ".svx"]),
  serverEntry: z.string().default("src/entry.{js,ts,mjs,mts}"),
});

type MaybeArray<T> = T | T[];

type SvelteOptions = {
  preprocess?: MaybeArray<PreprocessorGroup>;
  compilerOptions?: Omit<CompileOptions, "filename" | "format" | "generate">;
};

export type UserConfig = z.input<typeof options> & SvelteOptions;

export type Config = z.infer<typeof options> & SvelteOptions;
