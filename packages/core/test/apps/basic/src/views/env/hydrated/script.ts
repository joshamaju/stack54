import Component from "./component.svelte";

const btn = document.querySelector('[data-testid="hydrate"]');

btn?.addEventListener("click", () => {
  new Component({
    hydrate: true,
    target: document.getElementById("app")!,
  });
});
