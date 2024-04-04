<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Client assets</title>
    <script type="module" src="./script.ts"></script>
  </head>
  <body>
    <button data-testid="dec">-</button>
    <p data-testid="text"></p>
    <button data-testid="inc">+</button>

    <script>
      const inc = document.querySelector('[data-testid="inc"]');
      const dec = document.querySelector('[data-testid="dec"]');
      const text = document.querySelector('[data-testid="text"]');

      let count = 0;

      inc?.addEventListener("click", () => {
        if (text) text.textContent = (++count).toString();
      });

      dec?.addEventListener("click", () => {
        if (text) text.textContent = (--count).toString();
      });
    </script>
  </body>
</html>
