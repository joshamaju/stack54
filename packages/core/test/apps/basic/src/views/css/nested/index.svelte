<script lang="ts">
  import Document from "../../components/document.svelte";
  import Partial from "./partial.svelte";
</script>

<Document>
  <p data-testid="main">main</p>
  <Partial />
</Document>

<style>
  p {
    color: red;
  }
</style>
