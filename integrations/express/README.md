# stack54 express

Provides dev server and runtime utilities for your express application

## Installation

```bash
npm install @stack54/express
```

## Development server

```ts
// stack.config.js

import express from "@stack54/express/plugin";
import { defineConfig } from "stack54/config";

export default defineConfig({
  integrations: [express()],
});
```

## Rendering

You can choose any of the following options

### View engine

```ts
// src/entry.js
import express from "express";
import { View, engine } from "@stack54/express/view";
import { resolver } from "./utils/view";

const app = express();

app.engine("svelte", engine);
app.set("view engine", "svelte");
app.set("view", View({ resolve: resolver }));

app.get("/", (req, res) => {
  return res.render("home", {
    /** props */
  });
});

export default app;
```

### Middleware

```ts
// src/entry.js
import express from "express";
import { middleware as view } from "@stack54/express/render";
import { render } from "./utils/view";

const app = express();

// setup render function
app.use(view(render));

app.get("/", (req, res) => {
  return res.render("home", {
    /** props */
  });
});

export default app;
```

## Render Options

- $context: context map

- $stream `boolean`

render view to streaming response

### Streaming

```ts
import { Readable } from "node:stream";

app.get("/", (req, res) => {
  return res.render("home", { /** props */ $stream: true }, (error, stream) => {
    const content = Readable.fromWeb(stream);
    content.pipe(res);
  });
});
```
