# stack54

🚧 [WIP]

## What is stack54
stack54 is a fullstack, batteries included framework for building modern web applications. Leveraging Hono for routing, svelte for templating, and vite for bundling your server and client assets.

## ✨ Features

- Hot reload
- HTML asset bundling
- Typed environment variables
- Templates with Svelte and Markdown

## Get started
```bash
npx @stack54/cli new <project-name>
cd <project-name>
npm i
npm run dev
```

## Configuration

```ts
import { defineConfig } from "vite";
import stack54 from "stack54/vite";

export default defineConfig({
  plugins: [
    stack54({
      /* ...config */
    }),
  ],
});
```

### API

- `publicEnvPrefix`: default `PUBLIC\_`
- `extensions`: default `.svelte`, `.svx`
- `serverEntry`: default src/entry.{js,ts,mjs,mts}
- `preprocess`: [documentation](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/config.md#preprocess)
- `compilerOptions`: [documentation](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/config.md#compileroptions)

## Routing

```ts
import { Hono } from "hono";

const router = new Hono();

router.get("/", (ctx) => ctx.html(view("about")));
```

### Nested router

```ts
import { Hono } from "hono";

const router = new Hono();

// nested
const nested = new Hono();
nested.get("/", (ctx) => ctx.html(view("about")));
// nested

router.route("*", nested);
```

## Rendering
To render a component/template, include `ssr` query in your import statement i.e

```ts
import { renderToString } from "stack54/render";
import About from "./views/about.svelte?ssr";

renderToString(
  About.render({
    /* props */
  })
);

// or

renderToString(About, {
  /* props */
});
```

Or

```ts
import { makeFactory, resolveComponent } from "stack54/render";

const templates = import.meta.glob("./views/**/*.page.svelte", {
  query: { ssr: true },
  eager: true, // optional
});

export const view = makeFactory((name) => {
  return resolveComponent(`./views/${name}.svelte`, templates);
});

view("about", {
  /* props */
});
```

Or

```ts
import { view } from "stack54/view";
import { makeFactory, resolveComponent } from "stack54/render";

const templates = import.meta.glob("./views/**/*.page.svelte", {
  query: { ssr: true },
  eager: true,
});

export const render = makeFactory((name) => {
  return resolveComponent(`./views/${name}.svelte`, templates);
});

const app = new Hono();

app.use(view(render));

app.get('/', ctx => ctx.render("about"))
```

### Why svelte
Using svelte means we can build UIs leveraging the power of composition using components, getting rid of the traditional layouts and partials approach, we also get type safety, automatic import update on refactor etc. And svelte is closer to HTML compared to other component frameworks, which makes it possible to discover HTML assets like stylesheet links, script tags etc to produce optimized assets for production.

## Limitations

- Cannot use dynamic import types in templates i.e

```svelte
<!-- /views/user.svelte -->
<script lang="ts">
  export let prop: import("some-module").Type;

  // Instead do
  import type {Type} "some-module";
  export let prop: Type;
</script>
```
