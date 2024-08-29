<script>
    import Document from "../components/document.svelte";
</script>

<Document>
    <script type="module" slot="head">
      const el = document.querySelector('[data-testid="env"]');
      const action = document.querySelector('[data-testid="get"]');

      action.addEventListener("click", () => {
        el.textContent = import.meta.env.ENV;
      })
    </script>

    <button data-testid="get">show</button>
    <p data-testid="env"></p>
</Document>
