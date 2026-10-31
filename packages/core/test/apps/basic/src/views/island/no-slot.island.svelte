<script island="load" lang="ts">
  import { onMount } from "svelte";
  import Counter from "./counter.svelte";
  let name: string | undefined;
  onMount(() => {
    name = "no slot";
    return () => {
      document.documentElement.dataset.islandCleanup = "done";
    };
  });
</script>

<p data-testid="no-slot">{name}</p>

<Counter />
