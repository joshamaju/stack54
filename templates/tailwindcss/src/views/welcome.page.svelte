<script lang="ts">
  import Document from "./components/document.entry.svelte";
</script>

<Document>
  <svelte:fragment slot="head">
    <link rel="stylesheet" href="./welcome.css" />
  </svelte:fragment>

  <section class="h-full flex">
    <main class="m-auto text-center">
      <h1 class="text-3xl">
        <img src="/stack54.png" alt="stack54" class="w-[20rem]" />
      </h1>
    </main>
  </section>
</Document>
