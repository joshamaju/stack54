<script lang="ts">
  import { Head } from "stack54/components";
  import { delay } from "./utils";
  const promise = delay(1000);
</script>

<Head />

<div data-testid="native-await">
  {#await promise}
    <div>Loading Native...</div>
  {:then value}
    <div>Native: {value}</div>
  {:catch error}
    <div>Error: {error}</div>
  {/await}
</div>
