<script lang="ts">
  import { encode } from "stack54/data";
  import Document from "./document.svelte";

  export let css: string;
  export let head: string;
  export let html: string;

  export let state: any;
</script>

<Document>
  <svelte:fragment slot="head">
    {@html head}
    {@html `<style>${css.code}</style>`}
    <link rel="stylesheet" href="./main.css" />
    {@html encode({ __SSR_STATE__: state }, { id: "data" })}
    <script type="module" src="./client-entry.ts"></script>
  </svelte:fragment>

  <div id="app">
    {@html html}
  </div>
</Document>
