<script lang="ts">
  import { Head } from "stack54/components";
  const {head, children} = $props()
</script>

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <Head />
    {@render head?.()}
  </head>
  <body>
    {@render children?.()}
  </body>
</html>
