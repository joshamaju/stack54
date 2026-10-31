# Integrations

Stack54 does not prescribe a server. Add the integration that connects its build and rendering utilities to your application.

## Express

Install `@stack54/express`. Its Vite integration is configured in `stack.config.js`:

```js
import expressPlugin from "@stack54/express/plugin";
import { defineConfig } from "stack54/config";

export default defineConfig({ integrations: [expressPlugin()] });
```

For rendering, `@stack54/express` provides a view engine (`@stack54/express/view`) and middleware (`@stack54/express/render`). View engine calls accept template props; `$context` supplies Svelte context and `$stream` requests streaming output. See the [Express README](../integrations/express/README.md) for complete examples and callback details.

## Hono

There are two Hono development setups in this repository. The `templates/hono` starter uses `@hono/vite-dev-server` directly inside the `vite` config. Separately, `@stack54/hono` provides Hono adapters and a Vite integration. To use that package, install it and configure its plugin:

```js
import hono from "@stack54/hono/plugin";
import { defineConfig } from "stack54/config";

export default defineConfig({ integrations: [hono()] });
```

The plugin uses the configured entry by default; its `entry` option can override that path. The package exports `./node`, `./render`, `./locals`, and `./plugin`. See the [Hono package README](../integrations/hono/README.md) for adapter details and the [Hono example](../examples/with-hono/README.md) for a working app.

## Islands

Install `@stack54/island` and add `island()` to integrations. Island directives mark components for client hydration:

```svelte
<script island="load">...</script>
<script island="idle">...</script>
<script island="media" value="(max-width: 50em)">...</script>
<script island="visible" value='{"rootMargin":"200px","threshold":1}'>...</script>
```

The `visible` directive's optional `value` must be valid JSON. Island components must not receive slotted children under Svelte 5; render that content outside the island boundary. See the [island README](../integrations/island/README.md).

## Service worker

Install `@stack54/service-worker` and add `serviceWorker()` to integrations. It searches for `src/service-worker.{js,ts,mjs,mts}` by default, builds the worker into `static` (or configured output), and serves the worker source during development. Options include `file`, `outDir`, and `scriptURL`. See the [service-worker README](../integrations/service-worker/README.md).

## Streaming package status

`@stack54/streaming@0.1.1` belongs to Stack54 0.14.x and Svelte 4. It is excluded from Stack54 1.x. Do not add it to a current Stack54 app; see [compatibility and migration](compatibility.md).
