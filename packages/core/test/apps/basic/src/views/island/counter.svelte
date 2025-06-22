<script>
  let count = 0;
</script>

<button data-testid="dec" onclick="{() => (count = count - 1)}">-</button>

<p data-testid="text">{count}</p>

<button data-testid="inc" onclick="{() => (count = count + 1)}">+</button>
