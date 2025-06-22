<script island="load">
  import Counter from "./counter.svelte";
  const {named, children} = $props()
</script>

<Counter />

<div data-testid="default-slot">
  {@render children?.()}
</div>

<div data-testid="named-slot">
  {@render named?.()}
</div>
