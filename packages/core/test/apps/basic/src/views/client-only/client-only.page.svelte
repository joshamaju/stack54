<script>
  import ClientOnly from "./client-only.svelte";
  import Document from "../components/document.svelte";
</script>

<Document>
  <div id="app">
    <ClientOnly />
  </div>

  <script type="module">
    import ClientOnly from "./client-only.svelte";

    window.HYDRATE = function () {
      new ClientOnly({ hydrate: true, target: document.getElementById("app") });

      document.dispatchEvent(
        new CustomEvent("client-only:hydrated", { bubbles: true })
      );
    };
  </script>
</Document>
