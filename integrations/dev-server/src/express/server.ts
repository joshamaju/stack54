import path from "node:path";
import { pathToFileURL } from "node:url";

import sirv from "sirv";
import type { Express } from "express";
import type { PreviewServer, ViteDevServer } from "vite";

export async function devServer(
  server: ViteDevServer,
  opts: { entry: string }
) {
  const serverEntry = await server.ssrLoadModule(opts.entry);
  const app: Express = serverEntry.default;
  server.middlewares.use(app);
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
