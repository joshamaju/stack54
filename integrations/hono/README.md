# @stack54/hono

Hono adapters for Stack54: a Vite development integration, Hono rendering middleware, Node.js request/response helpers, and request-local values. The Hono starter in `templates/hono` currently uses `@hono/vite-dev-server` directly; that is a separate setup.

## Install

```sh
npm install @stack54/hono hono
```

## Development integration

Add the Stack54 Hono plugin to the Stack54 config when using this package's development server integration:

```js
import hono from "@stack54/hono/plugin";
import { defineConfig } from "stack54/config";

export default defineConfig({
  integrations: [hono({ entry: "src/entry.ts" })],
});
```

`entry` is optional and defaults to Stack54's configured entry. This integration requires a single string entry pattern.

## Rendering and locals

The package exports `render` from `@stack54/hono/render`. It installs Hono's `ctx.render()` renderer using an application-provided function that renders a view name and props. It combines the optional `context` passed to the renderer with values set through `setLocals`:

```ts
import { render } from "@stack54/hono/render";
import { getLocals, setLocals } from "@stack54/hono/locals";
```

`getLocals(ctx)` returns all stored values; `getLocals(ctx, name)` returns one. `setLocals(ctx, name, value)` sets a value, and `setLocals(ctx, values)` merges a record.

## Node.js adapter

`@stack54/hono/node` exports `toNodeHandler(app)` to adapt a Hono app to Node's `IncomingMessage` and `ServerResponse`, plus `getRequest` and `setResponse` helpers for lower-level adaptation.

See the [Hono integration guide](../../docs/integrations.md#hono) and [`examples/with-hono`](../../examples/with-hono/README.md).
