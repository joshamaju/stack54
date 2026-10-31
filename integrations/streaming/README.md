# stack54 streaming

Adds support for streaming svelte `{#await}` block content from the server. While `{#await}` works as normal while running client side.

> **Compatibility:** `@stack54/streaming` is excluded from Stack54 1.x and does not support Svelte 5. The last compatible release is `@stack54/streaming@0.1.1`, for the Stack54 0.14.x / Svelte 4 release line. Do not combine it with Stack54 1.x.

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
