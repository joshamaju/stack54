# stack54 streaming

Adds support for streaming svelte `{#await}` block content from the server. While `{#await}` works as normal while running client side.

## Setup

```bash
npm install @stack54/streaming
```

```ts
// stack.config.js

import { defineConfig } from "stack54/config";
import streaming from "@stack54/streaming/plugin";

export default defineConfig({
  integrations: [streaming()],
});
```
