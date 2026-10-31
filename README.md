# Stack54

Stack54 combines modern web tooling with the directness of traditional server rendered applications. Use Svelte components, TypeScript-aware props and editor tooling, and Vite to build templates and assets, while keeping control over your server, routing, HTML output, and browser behavior. Its current templating language is Svelte: a familiar, HTML-like way to compose views with components instead of brittle string or path references to partials and layouts. Client JavaScript is opt-in: ship the scripts you choose, or add interactivity with islands. Stack54 does not include a framework runtime or hydrate pages by default.

Use it with Express, Hono, or another server/runtime. Stack54 does not add a router or automatically ship client JavaScript or hydrate pages.

## Get started

Create an app from a starter template:

```sh
npx create-stack54 my-app --template express
cd my-app
npm install
npm run dev
```

The CLI also accepts `--t` instead of `--template`. See the [quick start](docs/getting-started.md) for prerequisites and starter details.

## How it fits together

- Write server rendered views as Svelte components.
- Reference browser CSS and JavaScript explicitly in your HTML.
- Use a Stack54 integration or your own server code to render views and handle requests.
- Build output is served by your application server, reverse proxy, or CDN.

For a concise example, the Express starter registers the integration in `stack.config.js`:

```js
import express from "@stack54/express/plugin";
import { defineConfig } from "stack54/config";

export default defineConfig({
  integrations: [express()],
  views: ["src/views/**/*.{entry,page}.svelte"],
});
```

Its server entry uses the Express view engine to render a view from a route:

```ts
app.get("/", (_req, res) => {
  res.render("welcome", {});
});
```

See the [Express integration guide](integrations/express/README.md) for rendering setup, and [deployment](docs/deployment.md) for production server examples.

## Documentation

Start at the [documentation index](docs/README.md):

- [Why Stack54?](docs/why-stack54.md)
- [Quick start](docs/getting-started.md)
- [Core concepts](docs/core-concepts.md)
- [Configuration and CLI](docs/configuration.md)
- [API reference](docs/api-reference.md)
- [Development workflows](docs/development-and-deployment.md)
- [Deployment](docs/deployment.md)
- [Integrations](docs/integrations.md)
- [Templates and examples](docs/examples.md)
- [Compatibility and migration](docs/compatibility.md)

## Packages and integrations

- [`stack54`](packages/core/README.md) — core build and rendering package.
- [`create-stack54`](packages/create/README.md) — project scaffolder.
- [`@stack54/express`](integrations/express/README.md)
- [`@stack54/hono`](integrations/hono/README.md)
- [`@stack54/island`](integrations/island/README.md)
- [`@stack54/service-worker`](integrations/service-worker/README.md)
- [`@stack54/streaming`](integrations/streaming/README.md) — Stack54 0.14 / Svelte 4 only; not compatible with 1.x.

## Examples and starters

Browse [examples](docs/examples.md) for working applications and [templates](templates/) for project starters. Current starters include Express, Hono, standalone, HTMX, and Tailwind CSS.

## Compatibility

Stack54 1.x requires Node.js `^20.19.0 || >=22.12.0`, Svelte `^5.46.4`, `@sveltejs/vite-plugin-svelte` `^7.3.1`, and Vite `^8.0.9`. Existing Svelte 4 component syntax remains supported by Svelte 5; see [compatibility and migration](docs/compatibility.md) for details and limitations.

## Contributing

This repository is a pnpm workspace. See [AGENTS.md](AGENTS.md) for project structure, build and test commands, and the Changesets release process.

## License

[MIT](LICENSE)
