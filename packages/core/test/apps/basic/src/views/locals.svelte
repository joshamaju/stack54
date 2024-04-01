<script lang="ts">
  import { getLocals } from "stack54/view";
  const locals = getLocals();
</script>

<p data-testid="locals">{locals?.user}</p>
