<script>
  import { onMount } from "svelte";

  let mounted = false;

  onMount(() => {
    mounted = true;
  });
</script>

<!-- Avoid rendering browser-only content during server-side rendering. -->
{#if mounted}
  <slot />
{/if}
