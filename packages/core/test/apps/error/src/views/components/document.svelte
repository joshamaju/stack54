<script lang="ts">
  import { Head } from "stack54/components";
</script>

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <Head />
    <slot name="head" />
  </head>
  <body>
    <slot />
  </body>
</html>
