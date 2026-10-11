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

<!-- The renderer replaces this marker with collected head elements and CSS. -->
{@html HEAD_INSERTION_MARKER}
