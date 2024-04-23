<script lang="ts">
  import { Head } from "stack54/components";
  import Button from "./button.svelte";
</script>

<svelte:head>
  <link data-testid="page-style" rel="stylesheet" href="./page.css" />
</svelte:head>

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <Head />
  </head>
  <body>
    <Button />
  </body>
</html>
