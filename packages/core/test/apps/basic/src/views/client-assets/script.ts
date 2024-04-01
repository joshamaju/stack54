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
