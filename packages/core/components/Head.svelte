<script>
  import { getContext } from "svelte";
  import {
    HEAD_CONTEXT_KEY,
    HEAD_INSERTION_MARKER,
  } from "stack54/runtime/internals";

  /** @type {string} */
  const head = getContext(HEAD_CONTEXT_KEY);
</script>

{#if head}
  {@html head}
{/if}

{@html HEAD_INSERTION_MARKER}
