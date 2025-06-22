<script lang="ts">
  import Document from "../components/document.svelte";
</script>

<Document>
  {#snippet head()}
  <title>CSS - Inline</title>
  {/snippet}
  <p>Text</p>
</Document>

<style>
  p {
    color: red;
  }
</style>
