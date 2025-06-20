<script>
  const { children } = $props();
</script>

{#if typeof window != "undefined"}
  {@render children()}
{/if}
