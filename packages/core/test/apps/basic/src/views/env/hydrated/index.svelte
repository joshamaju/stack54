<script>
  import Component from "./component.svelte";
</script>

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body>
    <button data-testid="hydrate">hydrate</button>

    <div id="app">
      <Component />
    </div>

    <script type="module" src="./script.ts"></script>
  </body>
</html>
