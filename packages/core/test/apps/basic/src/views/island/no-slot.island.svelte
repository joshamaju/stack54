<script island="load" lang="ts">
  import Counter from "./counter.svelte";
  let name = $state<string | undefined>(undefined);
  $effect(() => {
    name = "no slot";
  });
</script>

<p data-testid="no-slot">{name}</p>

<Counter />
