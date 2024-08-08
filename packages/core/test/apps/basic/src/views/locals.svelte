<script lang="ts">
  import { getLocals } from "stack54/locals";
  const locals = getLocals();
</script>

<p data-testid="locals">{locals?.user}</p>
