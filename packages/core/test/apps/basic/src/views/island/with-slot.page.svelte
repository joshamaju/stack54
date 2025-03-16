<script>
  import Document from "../components/document.svelte";
  import WithSlot from "./with-slot.island.svelte";
</script>

<Document>
  <WithSlot>
    <div>
      <p>default</p>
    </div>

    <div slot="named">
      <p>named</p>
    </div>
  </WithSlot>
</Document>
