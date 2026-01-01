import { glob } from "glob";
import fs from "node:fs";
import { join, parse } from "node:path";
import { Integration, ResolvedConfig } from "stack54/config";
import { to_fs } from "stack54/internals";
import { dedent } from "ts-dedent";
import type { Plugin } from "vite";
import * as vite from "vite";
import { z } from "zod";
import color from "kleur";

// @ts-ignore `vite.rolldownVersion` only exists in `rolldown-vite`
const isRolldown = !!vite.rolldownVersion;

const configSchema = z
  .object({
    /**
     * Service worker source file
     * @default "src/service-worker.{js,ts,mjs,mts}"
     */
    file: z.string().default("src/service-worker.{js,ts,mjs,mts}"),

    /**
     * Output directory - inherits from `config.staticDir`
     */
    outDir: z.string().optional(),

    /**
     * The URL you use in registering the service worker. Used to provide
     * service worker in development mode.
     *
     * @example
     * ```javascript
     * navigator.serviceWorker.register("/service-worker.js", { ... })
     * ```
     */
    scriptURL: z.string().optional(),
  })
  .default({});

export default async function serviceWorkerIntegration(
  userConfig?: z.infer<typeof configSchema>
): Promise<Integration> {
  let config: ResolvedConfig;

  const user_config_ = configSchema.safeParse(userConfig);

  if (!user_config_.success) {
    throw new Error(user_config_.error.message);
  }

  const user_config = user_config_.data;

  const cwd = process.cwd();

  const entry = await glob(user_config.file, { cwd });

  if (!entry.length) {
    throw new Error("Service worker file not found");
  }

  const service_worker_file = entry[0];
  const { name: filename } = parse(service_worker_file);

  const VIRTUAL_MODULE_ID = "stack54:service-worker";
  const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;
  const base = "location.pathname.split('/').slice(0, -1).join('/')";

  const noop_plugin: Plugin = {
    apply: "serve",
    name: "stack54:service-worker",
    resolveId(source) {
      if (source === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
    },
    load: {
      order: "pre",
      handler(id) {
        const service_worker_code = dedent`
        export const base = /*@__PURE__*/ ${base};
        export const build = [];
        export const version = "0.0.0";
        `;

        if (id === RESOLVED_VIRTUAL_MODULE_ID) {
          return service_worker_code;
        }
      },
    },
  };

  return {
    name: "stack54:service-worker",
    config(_) {
      return {
        vite: {
          plugins: [noop_plugin],
        },
      };
    },
    configResolved(config_) {
      config = config_;
      const file = join(cwd, config.staticDir, `${filename}.js`);
      if (fs.existsSync(file)) fs.rmSync(file);
    },
    configureServer(server) {
      return async () => {
        server.middlewares.use(async (req, res, next) => {
          const base = `${server.config.server.https ? "https" : "http"}://${
            req.headers[":authority"] || req.headers.host
          }`;

          const decoded = decodeURI(new URL(base + req.url).pathname);

          const name = user_config.scriptURL ?? `/${filename}.js`;

          if (decoded === name) {
            const resolved = join(cwd, service_worker_file);

            if (fs.existsSync(resolved)) {
              res.writeHead(200, { "content-type": "application/javascript" });
              res.end(`import '${to_fs(resolved)}';`);
            } else {
              res.writeHead(404);
              res.end("not found");
            }

            return;
          }

          next();
        });
      };
    },
    async buildEnd(manifest) {
      function vitePlugin(): Plugin {
        return {
          name: "stack54:service-worker",
          resolveId(source) {
            if (source === VIRTUAL_MODULE_ID) {
              return RESOLVED_VIRTUAL_MODULE_ID;
            }
          },
          load: {
            order: "pre",
            handler(id) {
              const service_worker_code = dedent`
              export const base = /*@__PURE__*/ ${base};
              
              export const build = [${Object.values(manifest)
                .map((_) => _.map((_) => _.file))
                .flat()
                .map((file) => JSON.stringify(file))
                .join(",\n")}
              ];
              
              export const version = "0.0.0";
              `;

              if (id === RESOLVED_VIRTUAL_MODULE_ID) {
                return service_worker_code;
              }
            },
          },
        };
      }

      console.log();
      console.log(color.yellow("starting service worker build"));
      console.log();

      const start = process.hrtime.bigint();

      const out = join(cwd, config.staticDir);

      await vite.build({
        publicDir: false,
        configFile: false,
        define: config.vite.define,
        plugins: [vitePlugin(), ...(config.vite.plugins || [])],
        build: {
          ssr: false,
          outDir: out,
          emptyOutDir: false,
          modulePreload: false,
          copyPublicDir: false,
          minify: config.build.minify,
          rollupOptions: {
            input: service_worker_file,
            output: {
              inlineDynamicImports: true,
              // .mjs so that esbuild doesn't incorrectly inject `export` https://github.com/vitejs/vite/issues/15379
              entryFileNames: `${filename}.${isRolldown ? "js" : "mjs"}`,
            },
          },
        },
        // experimental: {
        //   renderBuiltUrl(filename) {
        //     return {
        //       runtime: `new URL(${JSON.stringify(
        //         filename
        //       )}, location.href).pathname`,
        //     };
        //   },
        // },
      });

      if (!isRolldown) {
        fs.renameSync(`${out}/${filename}.mjs`, `${out}/${filename}.js`);
      }

      const end = process.hrtime.bigint();
      const time = Number(end - start) / 1e6;

      console.log();
      console.log(
        color.green(`✔︎ service worker built ${display_time(Math.round(time))}`)
      );
      console.log();
    },
  };
}

function display_time(time: number): string {
  // display: {X}ms
  if (time < 1000) {
    return `${time}ms`;
  }

  time = time / 1000;

  // display: {X}s
  if (time < 60) {
    return `${time.toFixed(2)}s`;
  }

  const mins = parseInt((time / 60).toString());
  const seconds = time % 60;

  // display: {X}m {Y}s
  return `${mins}m${seconds < 1 ? "" : ` ${seconds.toFixed(0)}s`}`;
}
