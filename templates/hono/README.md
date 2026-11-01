# Hono starter

This starter uses Hono with `@hono/vite-dev-server` during development, and `@hono/node-server` for its production server. It does not use the separate `@stack54/hono` integration package.

```sh
npm install
npm run dev
```

Build and start the production server with:

```sh
npm run build
npm run start
```

The production entry is `bin/server.js`. See the [Hono integration guide](../../docs/integrations.md#hono) for the distinction between this starter and `@stack54/hono`, and the [deployment guide](../../docs/deployment.md) for its asset serving setup.
