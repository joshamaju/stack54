# Core concepts

## Stack54's responsibility

Stack54 provides a build pipeline for Svelte views and browser assets, plus runtime rendering utilities. Your application provides the server, routes, request lifecycle, data loading, and response policy. Stack54 does not add a client runtime or automatically hydrate rendered pages.

## Views and entries

The `views` setting selects Svelte view files (by default `src/views/**/*.svelte`). The `entry` setting selects one or more server entry files (by default `src/entry.{js,ts,mjs,mts}`). Integrations connect the build pipeline to the server or runtime you chose.

Svelte is Stack54's current templating language. Its component model lets templates compose layouts and reusable pieces through imports and props, with TypeScript support, instead of relying on string or path lookups for partials. This gives server rendered templates a typed, editor friendly composition model while keeping their source close to HTML.

Templates are rendered into HTML on the server. The application decides when and how to call a rendering helper and what response to send. See the [Express](../integrations/express/README.md) package guide for its view engine and middleware styles.

## Browser assets are explicit

Write the `<script>` and `<link>` tags that should appear in your HTML. Stack54 processes referenced assets and updates their output paths during the build; it does not invent client behavior, inject an application bundle, or choose a hydration strategy for you.

By default, `svelte.emitCss` is `false`, so component styles are included in the Svelte server render's `head`. If enabled, Vite emits component CSS as separate files. Stack54 does not resolve those files through the manifest and add stylesheet links; the application must link them itself. See the [CSS asset follow-up plan](plans/external-svelte-css-assets.md).

## Integrations

An integration is a named plugin that can participate in Stack54's build and dev lifecycle. Integrations can contribute Vite config and hooks such as `config`, `configResolved`, `buildStart`, `buildEnd`, `transform`, and `configureServer`. Use an integration package when it exists for your runtime, or implement the server connection in your own application.

## Streaming and framework UI

The rendering APIs and server integrations determine whether output is returned as a string or a stream. Refer to the selected integration's API and examples for the supported call shape. The old `@stack54/streaming` package is for the Stack54 0.14/Svelte 4 line and is not compatible with 1.x.
