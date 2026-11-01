# API reference

This page summarizes the main public APIs exported by the current `stack54` package. The package's generated TypeScript declarations provide full signatures.

## Rendering

Import rendering helpers from `stack54` or the `stack54/render` subpath:

```ts
import { renderToString, renderToStream } from "stack54/render";
import type { Options, Props, Template } from "stack54/types";
```

- `renderToString(template, props?, options?)` renders a Svelte 5 component to an HTML string.
- `renderToStream(template, props?, options?)` renders to a `ReadableStream<Uint8Array>`. The stream renderer supports deferred content through Stack54's `Await` component.
- `Options.context` is a `Map<string, unknown>` passed as Svelte context.
- `Props` is the record of component props accepted by the helpers; `Template` is a Svelte 5 component value.

```ts
const html = renderToString(Page, { title: "Home" }, {
  context: new Map(),
});
```

`renderToStream` returns a `ReadableStream` directly. Check the target server adapter's guide for piping Web streams to its response type.

## Resolving templates

The `stack54/render/utils` subpath exports:

- `resolveComponent(path, components)`: retrieve a component module from an eager or lazy component map. A list of paths can be supplied to match aliases.
- `createRenderer({ resolve, render })`: create a function that accepts either a template path or component and dispatches to the supplied renderer.
- `is_template(value)`: identify a component value.

For a resolver using Vite's `import.meta.glob`, see the [Express starter resolver](../templates/express/src/utils/view.ts).

## Data and context

The `stack54/data` subpath exports:

- `encode(data, { id? })`: serialize data into an `application/json` script element, escaping characters that could break out of the element.
- `decode<T>(id)`: read and parse the element with that DOM id; returns `null` when it is absent or empty.
- `stringify` and `parse`: the underlying `devalue` serialization helpers.

The `stack54/locals` subpath exports `getLocals()` for reading the locals object from Svelte context and `makeLocals(locals)` for creating the context map used by render integrations.

## Built in components

Import from `stack54/components` to use `Head`, `Await`, `LiveReload`, or `ClientOnly`. Individual component subpaths are also exported, such as `stack54/components/Head` and `stack54/components/Await`. `Await` is used for deferred content with streaming renders; the other components provide head management, development reload support, and client-only rendering behavior respectively.

## Configuration

Import `defineConfig`, `defineIntegration`, and the configuration types from `stack54/config`:

- `defineConfig(config)` provides a typed configuration helper. It accepts a config object or a function receiving `"build"` or `"serve"`.
- `defineIntegration(integration)` provides a typed helper for an integration.
- `Integration`, `UserConfig`, and `ResolvedConfig` are exported types.

See [Configuration and CLI](configuration.md) for configuration fields and defaults.

## Integration APIs

Integration packages expose framework-specific APIs in addition to core:

- [`@stack54/express`](../integrations/express/README.md): `@stack54/express/plugin`, `@stack54/express/view`, and `@stack54/express/render`.
- [`@stack54/hono`](../integrations/hono/README.md): `@stack54/hono/plugin`, `@stack54/hono/render`, `@stack54/hono/locals`, and `@stack54/hono/node`.
- [`@stack54/island`](../integrations/island/README.md): island integration, hydration helpers, and directives.
- [`@stack54/service-worker`](../integrations/service-worker/README.md): service-worker build integration.

See each package README for usage and framework-specific behavior.

## Public subpaths

The core package exports `stack54`, `stack54/config`, `stack54/types`, `stack54/data`, `stack54/locals`, `stack54/render`, `stack54/render/utils`, `stack54/render/static`, `stack54/render/streaming`, and component subpaths. Use the subpaths for explicit imports; prefer public exports over `stack54/internals`.
