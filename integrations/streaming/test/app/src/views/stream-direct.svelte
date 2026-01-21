<script lang="ts">
  import Await from "stack54/components/Await";
  import { Head } from "stack54/components";
  import { delay } from "./utils";
</script>

<Head />

<div data-testid="await-component">
  <Await resolve="{delay(1000)}">
    <div slot="fallback">Loading Component...</div>
    <div slot="error" let:error>Error: {error}</div>
    <div slot="default" let:value>Component: {value}</div>
  </Await>
</div>
