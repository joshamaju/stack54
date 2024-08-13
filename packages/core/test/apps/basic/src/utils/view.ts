import { unsafeMakeFactory, resolveComponent } from "stack54/render";
import { type TemplateModule } from "stack54/types";

const components = import.meta.glob<TemplateModule>("../views/**/*.svelte", {
  eager: true,
});

export const render = unsafeMakeFactory((name) => {
  return resolveComponent(`../views/${name}.svelte`, components);
});
