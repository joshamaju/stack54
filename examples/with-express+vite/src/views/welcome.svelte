<script lang="ts">
  import Document from "./components/document.svelte";
</script>

<Document>
  <svelte:fragment slot="head">
    <link rel="stylesheet" href="./welcome.css" />
  </svelte:fragment>

  <section>
    <main>
      <h1>
        <img src="/stack54.png" alt="stack54" />
      </h1>

      <h3>Hello</h3>
    </main>
  </section>
</Document>

<style>
  section {
    height: 100%;
    display: flex;
  }

  main {
    margin: auto;
    text-align: center;
  }

  h1 {
    font-size: 7rem;
  }

  img {
    width: 20rem;
  }
</style>
