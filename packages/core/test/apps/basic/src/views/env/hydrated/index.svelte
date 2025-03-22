<script>
  import Document from "../../components/document.svelte";
  import Component from "./component.svelte";
</script>

<Document>
  <script slot="head" type="module">
    import Component from "./component.svelte";

    const btn = document.querySelector('[data-testid="hydrate"]');

    btn.addEventListener("click", () => {
      new Component({ hydrate: true, target: document.getElementById("app") });
    });
  </script>

  <button data-testid="hydrate">hydrate</button>

  <div id="app">
    <Component />
  </div>
</Document>
