# stack54 express

Provides runtime utilities and a dev server for your express application

## Setup

```bash
npm install @stack54/express
```

```ts
// stack.config.js

import express from '@stack54/express/plugin';
import { defineConfig } from "stack54/config";

export default defineConfig({
  integrations: [/** integrations */, express()],
});
```

## Usage

```ts
// src/entry.js
import express from "express";
import { register } from "@stack54/express/render";
import { render } from "./utils/view";

const app = express();

// setup view engine render function
register(app, render);

app.get("/", (req, res) => {
  return res.render("home", { /** props */ });
});

export default app;
```
