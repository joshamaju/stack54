import { type TemplateModule } from "stack54/types";
import { resolveComponent } from "stack54/render/utils";

const components = import.meta.glob<TemplateModule>(
  "../views/**/*.page.svelte",
  {
    eager: true,
  }
);

export const resolver = (name: string) => {
  return resolveComponent(`../views/${name}.page.svelte`, components);
};
