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

    <script type="module">
      import Component from "./component.svelte";

      const btn = document.querySelector('[data-testid="hydrate"]');

      btn.addEventListener("click", () => {
        new Component({
          hydrate: true,
          target: document.getElementById("app"),
        });
      });
    </script>
  </body>
</html>
