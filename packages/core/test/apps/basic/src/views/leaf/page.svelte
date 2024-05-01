<script lang="ts">
  import { Head } from "stack54/components";
  import Counter from "./counter.svelte";
</script>

<svelte:head>
  <link rel="stylesheet" href="./page.css" />
</svelte:head>

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <Head />
  </head>
  <body>
    <Counter />
  </body>
</html>
