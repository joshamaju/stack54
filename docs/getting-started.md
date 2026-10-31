# Quick start

The fastest way to start is with a repository template through `create-stack54`.

```sh
npx create-stack54 my-app --template express
cd my-app
npm install
npm run dev
```

You can use `--t` as a shorter alias for `--template`. If you omit the template, the CLI fetches the available template list from GitHub and prompts you to choose one. Template names correspond to directories in [`templates/`](../templates/).

## Project shape

A typical application has:

- `stack.config.js` for build and integration settings;
- `src/entry.ts` (or a JavaScript equivalent) for the server entry;
- `src/views/` for Svelte templates;
- `static/` for public files;
- a server framework such as Express or Hono, selected and configured by the application.

The exact file layout and npm scripts depend on the selected template. Read its README before assuming scripts are shared across starters.

To choose between an integrated Vite development server and a standalone build workflow, see [Development workflows and deployment](development-and-deployment.md).

## Build and run

Most templates expose scripts for development, production build, and starting the server. Run `npm run` in the generated project to see its actual scripts. The Stack54 CLI itself provides:

```sh
stack54 dev
stack54 build
```

The dev command runs the Vite development pipeline. The build command produces the application build using `stack.config.js`. Stack54 does not start or prescribe your production server; use the server entry and start script supplied by your project.

## Install packages directly

To integrate an existing app, install `stack54`, Svelte, Vite, and the Svelte Vite plugin, then add the integration package for your server. The [integration guide](integrations.md) describes the currently documented integrations.
