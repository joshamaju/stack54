<script lang="ts">
  import { Head } from "stack54/components";
  import { delay } from "./utils";
</script>

<Head />

<div data-testid="native-await">
  {#await delay(1000, true) catch error}
    <div>Error: {error}</div>
  {/await}
</div>
