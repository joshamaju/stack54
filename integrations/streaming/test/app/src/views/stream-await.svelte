<script lang="ts">
  import { Head } from "stack54/components";
  import { delay } from "./utils";
</script>

<Head />

<div data-testid="native-await">
  {#await delay(1000)}
    <div>Loading Native...</div>
  {:then value}
    <div>Native: {value}</div>
  {:catch error}
    <div>Error: {error}</div>
  {/await}
</div>
