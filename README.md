# stack54

Escape framework hell. A **server-first web stack** for building server-rendered applications with **explicit control over servers, assets, and HTML output**.

stack54 does not provide routing, servers, or client runtimes. It focuses on **processing assets, rendering templates, and producing HTML**, while leaving application structure, request handling, and client behavior entirely up to you.

---

## Key features

* 🔌 **Bring Your Own Server (BYOS)**
  stack54 has no opinion about routing or request handling. Use Express, Hono, any Node.js, Deno or Bun server, or even non-JS runtimes like Spring Boot.
  You control the entry point and request lifecycle.

* **Svelte as a Templating Layer**
  Use Svelte for server-side HTML generation. Templates compile to deterministic HTML without introducing a client-side framework or runtime unless you explicitly opt in.

* 🏝️ **You Control What JavaScript Ships**
  stack54 does not inject or generate client-side JavaScript. You explicitly author `<script>` and `<link>` tags, just like in traditional web applications.
  CSS and JS/TS assets are processed and emitted, and HTML references are updated to point to the built output.

* 🧩 **Framework-Agnostic UI**
  Mix Svelte templates, React-rendered output, or plain HTML in the same project. stack54 does not enforce a UI model, hydration strategy, or client-side convention.

* **Pluggable Build and Integration System**
  Extend or replace asset processing, HTML generation, and output behavior via plugins. Integrations are explicit and composable.

---

## Minimal example

A complete server-rendered page with explicit HTML and assets.

### Template (`views/page.svelte`)

```svelte
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>stack54</title>

    <!-- Explicit assets -->
    <link rel="stylesheet" href="./assets/app.css" />
    <script src="./assets/app.ts" defer></script>
  </head>

  <body>
    <h1>Hello from stack54</h1>
    <p>This page is rendered on the server.</p>
  </body>
</html>
```

---

### Client script (`assets/app.ts`)

```ts
document.addEventListener("DOMContentLoaded", () => {
  console.log("This JavaScript runs because you explicitly shipped it.");
});
```

---

### Server integration (Express example)

```ts
import express from "express";
import { engine, View } from "@stack54/express/view";

import { resolver } from "./utils/view";

const app = express();

app.engine("svelte", engine);
app.set("view engine", "svelte");
app.set("view", View({ resolve: resolver }));

app.get("/", (_, res) => {
  res.render("page.svelte");
});

app.listen(3000);
```

---

### What stack54 does here

* Compiles the Svelte template to HTML
* Processes `app.css` and `app.ts`
* Emits built assets
* Rewrites HTML references to point to the processed output

### What stack54 does **not** do

* No routing abstractions
* No injected JavaScript
* No automatic hydration
* No client runtime

What reaches the browser is exactly what you authored.

---

## Mental model

If modern frameworks treat the web as a client application that happens to render on the server, stack54 treats the web as **HTML first**, with assets and interactivity layered on explicitly.

Think of stack54 as:

* An asset pipeline that processes CSS and JS/TS
* A server-side HTML rendering system using Svelte templates
* A thin integration layer that fits into any server or runtime

Routing, request handling, data loading, and client behavior are entirely outside of stack54’s scope.

If you can build a traditional web application with `<link>` and `<script>` tags, you already understand the stack54 model.

---

## Who it’s for

Full-stack developers who want:

* Full ownership of routing, servers, and request lifecycles
* A modern asset pipeline without framework lock-in
* Server-rendered HTML with explicit client behavior
* Tooling that fits into existing architectures instead of redefining them

---

## What stack54 is not

* A routing framework
* A client-side framework or SPA solution
* A system that auto-hydrates or injects JavaScript
* An opinionated application structure

---

## Documentation

📘 [Documentation](https://github.com/joshamaju/stack54/wiki)

---

## Examples

* [Express integration](/examples/with-express)
* [React UI](/examples/with-react)
* [Svelte templates](/examples/with-svelte)
* [Todo app](/examples/todo)

---

## Starters

* [Standalone](/templates/standalone) – usable from any language runtime (e.g. Java)
* [Express](/templates/express)
* [Tailwind CSS](/templates/tailwindcss)

---

## License

[MIT](https://github.com/joshamaju/stack54/blob/main/LICENSE)