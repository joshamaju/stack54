<script>
  let count = 0;
</script>

<button data-testid="dec" on:click="{() => (count = count - 1)}">-</button>

<p data-testid="text">{count}</p>

<button data-testid="inc" on:click="{() => (count = count + 1)}">+</button>
