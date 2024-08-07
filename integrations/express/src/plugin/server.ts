import path from "node:path";
import { pathToFileURL } from "node:url";

import type { Express } from "express";
import sirv from "sirv";
import type { Connect, PreviewServer, ViteDevServer } from "vite";

export async function devServer(
  server: ViteDevServer,
  opts: { entry: string }
) {
  const handle: Connect.NextHandleFunction = async (req, res, next) => {
    const serverEntry = await server.ssrLoadModule(opts.entry, {
      fixStacktrace: true,
    });

    const app = serverEntry.default;
    app(req, res, next);
  };

  // server.middlewares.stack.unshift({ handle, route: "" });

  server.middlewares.use(handle);
}

export async function previewServer(server: PreviewServer) {
  const publicDir = server.config.publicDir;
  const { outDir, assetsDir } = server.config.build;

  const module = await import(
    pathToFileURL(path.join(outDir, "index.js")).href
  );

  const app: Express = module.default;

  server.middlewares.use(
    sirv(publicDir, {
      setHeaders: (res, pathname) => {
        // only apply to build output directory
        if (pathname.startsWith(`/${assetsDir}`)) {
          res.setHeader("cache-control", "public,max-age=31536000,immutable");
        }
      },
    })
  );

  server.middlewares.use(app);
}
