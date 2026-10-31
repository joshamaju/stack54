# Stack54 documentation

Stack54 is a server first rendering and asset build system. It builds Svelte templates and browser assets, while your application owns routing, request handling, and the server.

## Guides

- [Why Stack54?](why-stack54.md): compare the template composition model and its tradeoffs.
- [Quick start](getting-started.md): create and run an app from a starter.
- [Core concepts](core-concepts.md): understand rendering, assets, and the request lifecycle.
- [Configuration and CLI](configuration.md): configure `stack.config.js`, development, and production builds.
- [API reference](api-reference.md): core rendering, config, utility, and integration exports.
- [Development workflows](development-and-deployment.md): choose between Vite and standalone development.
- [Deployment](deployment.md): build and serve generated output with your server framework.
- [Integrations](integrations.md): use Express, Hono, islands, and service workers.
- [Templates and examples](examples.md): choose a starter or inspect a working example.
- [Compatibility and migration](compatibility.md): current requirements and the Svelte 4 to Svelte 5 transition.

For package specific APIs, see the package [README files](../README.md#packages-and-integrations) and exported TypeScript declarations.

## Current compatibility

The current Stack54 1.x line requires Node.js `^20.19.0 || >=22.12.0`, Svelte `^5.46.4`, `@sveltejs/vite-plugin-svelte` `^7.3.1`, and Vite `^8.0.9`. See [compatibility and migration](compatibility.md) before combining packages from older release lines.
