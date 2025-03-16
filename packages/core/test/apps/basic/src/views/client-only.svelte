<script island="idle">
  import { ClientOnly } from "stack54/components";
  import WithSlot from "./island/with-slot.island.svelte";
</script>

<ClientOnly>
  <WithSlot>
    <p data-testid="client-only">Client only</p>
  </WithSlot>
</ClientOnly>
