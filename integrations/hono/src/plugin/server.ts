import path from "node:path";
import { pathToFileURL } from "node:url";
import type { PreviewServer, ViteDevServer } from "vite";
import type { Hono } from "hono";
import sirv from "sirv";

import { installPolyfills, shouldPolyfill } from "./polyfill.js";
import { getRequest, setResponse } from "../request.js";

const error_template = /*html*/ `
<html>
  <head>
    <script type="module" src="/@vite/client"></script>
  </head>
  <body>
    <pre>
      <code>Internal Server Error</code>
    </pre>
  </body>
</html>`;

export function devServer(server: ViteDevServer, opts: { entry: string }) {
  if (shouldPolyfill) {
    installPolyfills();
  }

  const serve_static = server.middlewares.stack.find(
    (middleware) =>
      (middleware.handle as Function).name === "viteServeStaticMiddleware"
  );

  server.middlewares.use(async (req, res) => {
    const base = `${server.config.server.https ? "https" : "http"}://${
      req.headers[":authority"] || req.headers.host
    }`;

    const request = getRequest({ base, request: req });
    const serverEntry = await server.ssrLoadModule(opts.entry);

    const app: Hono = serverEntry.default;

    app.onError(function (e, ctx) {
      console.error(String(e));

      server.ws.send({
        type: "error",
        err: {
          ...e,
          stack: e.stack!,
          // these properties are non-enumerable and will
          // not be serialized unless we explicitly include them
          message: e.message,
        },
      });

      return ctx.html(error_template, { status: 500 });
    });

    const response = await app.fetch(request);

    if (response.status === 404) {
      // @ts-expect-error
      serve_static?.handle(req, res, () => {
        setResponse(res, response);
      });
    } else {
      setResponse(res, response);
    }
  });
}

export async function previewServer(server: PreviewServer) {
  if (shouldPolyfill) {
    installPolyfills();
  }

  const protocol = server.config.preview.https ? "https" : "http";

  const publicDir = server.config.publicDir;
  const { outDir, assetsDir } = server.config.build;

  const module = await import(
    pathToFileURL(path.join(outDir, "index.js")).href
  );

  const app: Hono = module.default;

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

  server.middlewares.use(async (req, res) => {
    const host = req.headers["host"];
    const request = getRequest({ request: req, base: `${protocol}://${host}` });
    const response = await app.fetch(request);
    setResponse(res, response);
  });
}
