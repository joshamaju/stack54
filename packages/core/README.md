# MPA

🚧 [WIP]

## ✨ Features

- Hot reload
- HTML asset bundling
- Typed environment variables
- Templates with Svelte and Markdown

## Configuration

```ts
import { defineConfig } from "vite";
import mpa from "stack54/vite";

export default defineConfig({
  plugins: [
    mpa({
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

To render a component/template, include `ssr` query in file import i.e

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
  eager: true,
});

export const view = makeFactory((name) => {
  return resolveComponent(`./views/${name}.svelte`, templates);
});

view("about", {
  /* props */
});
```

## Limitations

- Cannot use dynamic import types in templates i.e

```ts
export let prop: import("some-module").Type;
```
