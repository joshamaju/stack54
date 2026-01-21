<script lang="ts">
  import { Head } from "stack54/components";
  import { delay } from "./utils";
</script>

<Head />

<div data-testid="native-await">
  {#await delay(1000) then value}
    <div>Native: {value}</div>
  {/await}
</div>
