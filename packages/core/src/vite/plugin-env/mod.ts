import { ConfigEnv, Plugin } from "vite";
import color from "kleur";
import { Env, createModule, writeTypes, load } from "./env.js";
import { is_view, parse_id } from "../utils/template.js";

const env_private = "$env/private";
const env_public = "$env/public";

export function plugin_env({ cwd, outDir }: { outDir: string; cwd: string }) {
  let env: Env;
  let config_env: ConfigEnv;

  const setup: Plugin = {
    name: "mpa:env",
    config(_, env) {
      config_env = env;
    },
    configResolved(config) {
      env = load({
        privatePrefix: "",
        dir: config.envDir,
        mode: config_env.mode,
        publicPrefix: "PUBLIC_",
      });

      writeTypes(env, { outDir });
    },

    resolveId(source, importer) {
      // treat $env/[public|private] as virtual
      if (source.startsWith("$env/")) {
        if (importer && source == env_private) {
          const { filename } = parse_id(importer);

          if (is_view(filename)) {
            const name = color.bold(filename.replace(cwd, ""));
            const msg = `Client module ${name} imports private environment variable(s)`;
            this.warn(color.yellow(msg));
          }
        }

        return `\0${source}`;
      }
    },
  };

  const client: Plugin = {
    name: "mpa:env-client",
    load(id) {
      switch (id) {
        case "\0$env/public":
          return createModule("$env/public", env.public);
        case "\0$env/private":
          return createModule(
            "$env/private",
            env.private,
            config_env.mode == "development"
          );
      }
    },
  };

  const server: Plugin = {
    name: "mpa:env-server",
    load(id) {
      switch (id) {
        case "\0$env/private":
          return createModule("$env/private", env.private);
      }
    },
  };

  return [setup, client, server];
}
