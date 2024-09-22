import { mergeConfig as mergeViteConfig } from "vite";
import { arraify } from "../utils/index.js";
import { UserConfig } from "./index.js";

// /** Cross-realm compatible URL */
// export function isURL(value: unknown): value is URL {
//   return Object.prototype.toString.call(value) === "[object URL]";
// }

// /** Returns true if argument is an object of any prototype/class (but not null). */
// export function isObject(value: unknown): value is Record<string, any> {
//   return typeof value === "object" && value != null;
// }

// function mergeRecursively(
//   defaults: Record<string, any>,
//   overrides: Record<string, any>,
//   rootPath: string
// ) {
//   const merged: Record<string, any> = { ...defaults };

//   for (const key in overrides) {
//     const value = overrides[key];

//     if (value == null) {
//       continue;
//     }

//     let existing = merged[key];

//     if (existing == null) {
//       merged[key] = value;
//       continue;
//     }

//     // fields that require special handling:
//     if (key === "vite" && rootPath === "") {
//       merged[key] = mergeViteConfig(existing, value);
//       continue;
//     }

//     if (key === "server" && rootPath === "") {
//       // server config can be a function or an object, if one of the two values is a function,
//       // create a new wrapper function that merges them
//       if (typeof existing === "function" || typeof value === "function") {
//         merged[key] = (...args: any[]) => {
//           const existingConfig =
//             typeof existing === "function" ? existing(...args) : existing;
//           const valueConfig =
//             typeof value === "function" ? value(...args) : value;
//           return mergeRecursively(existingConfig, valueConfig, key);
//         };

//         continue;
//       }
//     }

//     if (Array.isArray(existing) || Array.isArray(value)) {
//       merged[key] = [...arraify(existing ?? []), ...arraify(value ?? [])];
//       continue;
//     }

//     if (isURL(existing) && isURL(value)) {
//       merged[key] = value;
//       continue;
//     }

//     if (isObject(existing) && isObject(value)) {
//       merged[key] = mergeRecursively(
//         existing,
//         value,
//         rootPath ? `${rootPath}.${key}` : key
//       );
//       continue;
//     }

//     merged[key] = value;
//   }

//   return merged;
// }

// export function merge(
//   defaults: Record<string, any>,
//   overrides: Record<string, any>,
//   isRoot = true
// ): Record<string, any> {
//   return mergeRecursively(defaults, overrides, isRoot ? "" : ".");
// }

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
        ...arraify(defaults.svelte?.preprocess ?? []),
        ...arraify(overrides.svelte?.preprocess ?? []),
      ],
      compilerOptions: {
        ...defaults.svelte?.compilerOptions,
        ...overrides.svelte?.compilerOptions,
      },
    },
  };
}
