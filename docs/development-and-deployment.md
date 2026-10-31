# Development workflows and deployment

Stack54 can run through the Vite development server or build views for a server you run directly. Choose based on whether an integration exists for your server and how much of the build lifecycle you want to manage.

## Vite development server

Use this for the usual integrated workflow. A Stack54 server integration connects your application entry to Vite so the app can render views during development. For example, the Express starter registers `@stack54/express/plugin` in `stack.config.js` and uses `stack54 dev`:

```js
import express from "@stack54/express/plugin";
import { defineConfig } from "stack54/config";

export default defineConfig({
  integrations: [express()],
  views: ["src/views/**/*.{entry,page}.svelte"],
});
```

```sh
npm run dev
```

The connected application handles routes and rendering requests. Static asset serving in development is handled by Vite. The precise behavior depends on the integration; see [Integrations](integrations.md).

## Standalone build workflow

Use this when you want to run your server process directly or there is no suitable development integration. Run the server and view build watcher separately. In the standalone starter, `npm run dev` watches/restarts the Express server, and `npm run view:dev` rebuilds views when files under `resources` change:

```sh
# Terminal 1: application server watcher
npm run dev

# Terminal 2: Stack54 build watcher
npm run view:dev
```

For a one-time build, run `npm run view:build` (which invokes `stack54 build`). The standalone starter sets `build.outDir` to `build`; its server imports generated rendering helpers from `build/server/index.js`. If you choose a different output directory, update server paths to match. Review the starter's scripts before assuming it includes a production start command.

For production build and server setup, see the [deployment guide](deployment.md).
