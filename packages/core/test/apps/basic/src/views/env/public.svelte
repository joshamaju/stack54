<script>
    import Document from "../components/document.svelte";
</script>

<Document>
    {#snippet head()}
    <script type="module">
      const el = document.querySelector('[data-testid="env"]');
      const action = document.querySelector('[data-testid="get"]');

      action.addEventListener("click", () => {
        el.textContent = import.meta.env.PUBLIC_ENV;
      })
    </script>
    {/snippet}

    <button data-testid="get">show</button>
    <p data-testid="env"></p>
</Document>
