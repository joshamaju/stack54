<script island="load">
  import Counter from "./counter.svelte";
</script>

<Counter />

<div data-testid="default-slot">
  <slot />
</div>

<div data-testid="named-slot">
  <slot name="named" />
</div>
