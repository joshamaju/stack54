import { mergeConfig as mergeViteConfig } from "vite";
import { array } from "../utils/index.js";
import { UserConfig } from "./index.js";

export function merge(defaults: UserConfig, overrides: UserConfig): UserConfig {
  return {
    ...defaults,
    ...overrides,
    env: { ...defaults.env, ...overrides.env },
    build: { ...defaults.build, ...overrides.build },
    views: [...(defaults.views ?? []), ...(overrides.views ?? [])],
    vite: mergeViteConfig(defaults.vite ?? {}, overrides.vite ?? {}),
    integrations: [
      ...(defaults.integrations ?? []),
      ...(overrides.integrations ?? []),
    ],
    svelte: {
      ...defaults.svelte,
      ...overrides.svelte,
      extensions: [
        ...(defaults.svelte?.extensions ?? []),
        ...(overrides.svelte?.extensions ?? []),
      ],
      preprocess: [
        ...array(defaults.svelte?.preprocess ?? []),
        ...array(overrides.svelte?.preprocess ?? []),
      ],
      compilerOptions: {
        ...defaults.svelte?.compilerOptions,
        ...overrides.svelte?.compilerOptions,
      },
    },
  };
}
