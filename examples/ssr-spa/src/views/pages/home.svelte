<script lang="ts">
  import { Link } from "svelte-pilot";
  import { onMount } from "svelte";

  let count = 0;

  onMount(() => {
    const id = setInterval(() => (count = count + 1), 1000);
    return () => clearInterval(id);
  });
</script>

<svelte:head>
  <title>Home | SSR + SPA</title>
</svelte:head>

<nav>
  <Link to="/">Home</Link>
  <Link to="/about">About</Link>
</nav>

<h1>Home {count}</h1>

<style>
  h1 {
    color: red;
  }
</style>
