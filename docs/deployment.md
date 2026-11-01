# Deployment

Stack54 builds server rendering code and browser assets. Your application framework or runtime starts the server, handles requests, and serves the generated and public files. Stack54 does not provide a deployment platform or a universal production server.

## Build the application

From the application directory, install dependencies and run its production build script. In the repository's Express and Hono starters, that script runs `stack54 build`:

```sh
npm install
npm run build
```

The default output directory is `dist`; browser assets are emitted under the Vite asset directory. Stack54 also emits server output used by the app's production entry. The checked-in Express and Hono starters import `dist/server/index.js`. If you set `build.outDir`, adjust server imports and static file roots to match it.

The generated directory is build output. Include the output needed by your server in the deployment artifact, or build it as part of deployment. Also include the application server code, package metadata, and runtime dependencies required to start the server.

## Serve assets and route requests

Mount static file handling before the application router so asset requests are served as files and normal requests reach the app. Include both generated assets and the configured static source directory. The examples below follow the current repository starters; adjust routes and paths to your config and framework.

### Express

The Express starter serves `dist` and `static`, then mounts the generated router:

```js
import express, { static as static_ } from "express";
import router from "../dist/server/index.js";

const app = express();

app.use(static_("./dist", {
  immutable: true,
  maxAge: "1y",
}));
app.use(static_("static", { maxAge: "1h" }));
app.use(router);

const port = process.env.PORT || 3000;
app.listen(port);
```

Start the built app with the starter's script:

```sh
npm run start
```

### Hono on Node.js

The Hono starter serves generated assets at `/assets/*`, serves files from `static`, and mounts the generated router. It uses `@hono/node-server` to listen on the port:

```js
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import router from "../dist/server/index.js";

const app = new Hono();

app.use("/assets/*", serveStatic({ root: "./dist" }));
app.use("*", serveStatic({ root: "./static" }));
app.route("/", router);

const port = parseInt(process.env.PORT || "3001");
serve({ port, fetch: app.fetch });
```

The Hono starter's `npm run start` runs its server entry. If deploying Hono to another runtime, use that runtime's server adapter and static file strategy; the Stack54 build does not choose them.

## Match paths and caching to your config

The examples use the starter defaults. Review these settings before deployment:

- `build.outDir` controls generated output (default `dist`).
- `build.assetsDir` controls the asset subdirectory (default `client`; Vite output and integration behavior determine the final layout).
- `build.assetPrefix` controls the URL prefix (default `/`).
- `staticDir` selects the public file directory (default `static`).
- `svelte.emitCss` defaults to `false`. If enabled, link emitted component CSS in the rendered document yourself; Stack54 does not insert those links automatically.

Ensure that the URLs written into rendered HTML resolve to the paths your server or CDN serves. Use long lived immutable caching only for fingerprinted build assets. Choose a shorter or revalidation policy for public files whose names can remain constant as their contents change.

## Runtime configuration

Run the server using the runtime and Node version supported by the app's dependencies. The current core package requires Node.js `^20.19.0 || >=22.12.0`. Provide runtime secrets and environment variables through the hosting environment, and set `PORT` if the platform supplies one. Do not expose private values through client-visible configuration; Stack54's `env.publicPrefix` defaults to `PUBLIC_` for values intended to be public.

## Deployment checklist

- Run the production build and confirm the configured output directory is present.
- Start the application server using its own production entry point.
- Confirm the server imports the generated server entry from the configured output directory.
- Confirm built asset URLs and public static URLs are served by the app, a reverse proxy, or a CDN.
- Set runtime environment values and port using the host's configuration.
- Match cache headers to whether filenames are fingerprinted or stable.

For development server choices, see [Development workflows](development-and-deployment.md). For the options affecting build paths, see [Configuration](configuration.md).
