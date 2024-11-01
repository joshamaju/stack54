import type { Connect, ViteDevServer } from "vite";

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
