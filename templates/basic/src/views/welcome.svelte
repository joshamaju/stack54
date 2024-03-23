<script lang="ts">
  import Document from "./components/document.svelte";
  export let versions: { stack54: string; node: string; svelte: string };
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

      <div class="versions">
        <p>stack54 - <span>{versions.stack54}</span></p>
        <p>svelte - <span>{versions.svelte}</span></p>
        <p>node - <span>{versions.node}</span></p>
      </div>
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

  .versions {
    display: flex;
    align-items: center;
  }

  .versions > * {
    padding: 0 2rem;
  }

  .versions > * + * {
    border-left: 1px solid #ccc;
  }

  p {
    font-weight: bold;
  }

  span {
    font-style: italic;
    font-weight: 400;
  }
</style>
