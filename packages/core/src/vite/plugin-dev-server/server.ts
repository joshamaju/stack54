import type { ViteDevServer } from "vite";

import type { Hono } from "hono";

import color from "kleur";

import { shouldPolyfill } from "../utils/platform.js";
import { installPolyfills } from "../utils/polyfill.js";
import { getRequest, setResponse } from "../utils/reqres.js";

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
      console.error(color.bold().red(String(e)));

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
