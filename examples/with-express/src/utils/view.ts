import { resolveComponent } from "stack54/render";
import { type TemplateModule } from "stack54/types";

const components = import.meta.glob<TemplateModule>("../views/**/*.svelte", {
  eager: true,
});

export const resolve = (name: string) => {
  return resolveComponent(
    [`../views/${name}`, `../views/${name}.svelte`],
    components
  );
};
