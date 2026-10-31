# Templates and examples

Templates are starting points; examples demonstrate particular app structures or features. Their scripts and dependencies vary, so check each project's `package.json` and README before running commands.

## Templates

- [`templates/express`](../templates/express/README.md): Express starter.
- [`templates/hono`](../templates/hono/README.md): Hono starter.
- [`templates/standalone`](../templates/standalone/README.md): separate view and server build workflow.
- [`templates/tailwindcss`](../templates/tailwindcss/README.md): Tailwind CSS starter.
- [`templates/htmx`](../templates/htmx/README.md): HTMX starter.

## Examples

- [`examples/with-express`](../examples/with-express/README.md): Express application.
- [`examples/with-hono`](../examples/with-hono/README.md): Hono application and Vite build workflow.
- [`examples/todo`](../examples/todo/README.md): todo app.
- [`examples/with-remote-function`](../examples/with-remote-function/README.md): remote-function pattern.
- `examples/with-react`, `examples/with-svelte`, `examples/ssr-spa`, and `examples/ops-dashboard` are present in the repository; they currently have no README. Inspect their source and package scripts for setup details.

## Running a project

From a template or example directory, inspect `package.json` and run its documented install and development commands. Some examples use `watch` and `start`, while starters use `dev`, `build`, and `start`; there is no single script convention across all projects.
