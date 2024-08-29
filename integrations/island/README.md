# stack54 island

## Directives

# load

```svelte
<script island="load"></script>
```

## idle

```svelte
<script island="idle"></script>
```

## media query

```svelte
<script island="media" value="(max-width: 50em)"></script>
```

## visible

```svelte
<script island="visible"></script>
<!-- or -->
<script island="visible" value='{"rootMargin": "200px", "threshold": 1}'></script>
```

> `value` has to be a valid JSON

## Setup

```bash
npm install @stack54/island
```

```ts
// stack.config.js

import island from '@stack54/island'
import { defineConfig } from "stack54/config";

export default defineConfig({
  integrations: [/** integrations */, island()],
});

```
