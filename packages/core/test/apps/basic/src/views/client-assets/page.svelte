<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script type="module" src="./script.ts"></script>

    {#each [1, 2, 3] as n}
      <script data-testid="each-script-{n}" type="module" src="./script.ts"></script>
    {/each}
  </head>
  <body>
    <button data-testid="dec">-</button>
    <p data-testid="text"></p>
    <button data-testid="inc">+</button>
  </body>
</html>
