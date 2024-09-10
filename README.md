# stack54

> The fun Javascript stack

## Background

stack54 is a build tool for building optimized multi page applications. We use svelte templates (instead of ejs, pug etc), which saves us from the brittleness of partials and layouts. And also we get full control over how our static assets like js and css are located (instead of placing everything in [project]/public/(js,css)).

## Features

- 🔌 BYOR (Bring Your Own Router)
- 📡 Streaming
- 🏝 Islands
- 🔗 Integrations

## View rendering

We use svelte as our view engine, check the svelte docs for more information on svelte. This makes it easy to build user interfaces as blocks i.e components. The equivalent of that would be partials in traditional templating languages.

One advantage this has over the traditional approach is that your templates are compiled at build time instead of runtime, so you don't have to think about templates caching to avoid compiling templates for every request. Your templates are compiled to plain strings which is very fast to render.

## Config

```ts
import express from "@stack54/express/plugin";
import { defineConfig } from "stack54/config";

export default defineConfig({
  integrations: [express()],
  views: ["src/views/**/*.svelte"],
  vite: { plugins: [vitePlugin()] },
});
```

- staticDir: your static files that are not to be processed. default = static
- vite: configure vite
- entry: your application entry point. default = src/entry.{js,ts,mjs,mts}
- views: array of template files, supports glob pattern. default = src/views/\*\*\/\*.svelte
- build:
  - minify: minify generated Javascript and HTML files
  - outDir: final output directory
  - assetPrefix: prefix for generated client assets
  - assetsDir: directory to output generated client assets
- env:
  - dir: environment variables directory
  - publicPrefix: prefix for environment variables that are allowed in client code. default = PUBLIC\_
- svelte:
  - emitCss: should emit inline component styles
  - extensions: svelte file extension. default = .svelte
  - preprocess: svelte pre-processors
  - compilerOptions:
    integrations: array of custom or third party plugins [see](/integrations)

### Integrations

- name: integration name
- buildStart: hook called when build starts (optional)
- buildEnd: hook called when build ends (optional)
- transform: hook to transform svelte templates (optional)
- transformHtml: hook to transform svelte templates during the client phase (optional)
- configResolved: runs after all integrations `config` hook (optional)
- config: hook to modify user and internal config (optional)
- configureServer: hook to configure application development server (optional)

## Setup

Start the development server

```bash
stack54 dev
```

build for production

```bash
stack54 build
```

## Serving static assets

Static assets are handled by the vite server in development. You need to handle that yourself in production. [checkout](/templates/express/bin/server.js) for example

## Utils

We provide utility functions for working with templates. They work irrespective of your framework of choice

- rendering
- data
- locals

## Components

stack54 also ships with some components, some are only useful in development

- Head
- HotReload
- ClientOnly
- Await

> Use Head if you have component styles and `svelte:head` tags, so they get included in your document head

### Usage

```svelte
<script>
  import {Head} from "stack54/components";
</script>
```

> Await should be imported differently

```svelte
<script>
  import Await from "stack54/components/Await";
</script>
```

## Streaming

```svelte
<script>
  import Await from "stack54/components/Await";

  const wait = (ms, value) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms, value);
    });
  };
</script>

<Await let:value resolve="{wait(1000, 10)}">
    <p slot="error" let:error>{error}</p>
    <p slot="fallback">loading...</p>
    <p>{value}</p>
</Await>
```

> Requires node version with support for `ReadableStream`

## Integrations

- [island](/integrations/island)
- [express](/integrations/express)
- [hono](/integrations/hono)

## Examples

- [express](/examples/with-express)
- [react](/examples/with-react)
- [svelte](/examples/with-svelte)

## License

[MIT](https://github.com/joshamaju/stack54/blob/main/LICENSE)
