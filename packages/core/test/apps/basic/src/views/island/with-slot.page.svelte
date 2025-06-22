<script>
  import Document from "../components/document.svelte";
  import WithSlot from "./with-slot.island.svelte";
  const {named: named_} = $props()
</script>

<Document>
  <WithSlot>
    {#snippet children()}
      <div>
        <p>default</p>
      </div>
    {/snippet}

    {#snippet named()}
      {#if named_}
        {@render named_()}
      {:else}
        <p>named</p>
      {/if}
    {/snippet}
  </WithSlot>
</Document>
