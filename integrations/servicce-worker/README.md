# stack54 service worker

## Setup

```bash
npm install @stack54/service-worker
```

```ts
// stack.config.js

import serviceWorker from "@stack54/service-worker";
import { defineConfig } from "stack54/config";

export default defineConfig({
  integrations: [serviceWorker()],
});
```
