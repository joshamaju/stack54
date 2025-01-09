import { loadEnv } from "vite";

export type Env = Record<string, string>;

export function load(dir: string, mode: string) {
  return loadEnv(mode, dir, "");
}

export function partition(env: Env, public_prefix: string) {
  const public_: Env = {};
  const private_: Env = {};

  for (const key in env) {
    const value = env[key];

    if (key.startsWith(public_prefix)) {
      public_[key] = value;
    } else {
      private_[key] = value;
    }
  }

  return { public: public_, private: private_ };
}

export function define(env: Env) {
  return Object.fromEntries(
    Object.entries(env).map(([key, val]) => {
      return [`import.meta.env.${key}`, JSON.stringify(val)];
    })
  );
}
