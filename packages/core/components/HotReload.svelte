<script>
  const dev = import.meta.env.DEV;
</script>

{#if dev}
  <script type="module" src="@vite/client"></script>
{/if}
