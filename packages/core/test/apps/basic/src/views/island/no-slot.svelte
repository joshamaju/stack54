<script island="load" lang="ts">
  import { onMount } from "svelte";
  import Counter from "./counter.svelte";
  let name: string | undefined;
  onMount(() => (name = "no slot"));
</script>

<p data-testid="no-slot">{name}</p>

<Counter />
