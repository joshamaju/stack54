import { resolve_component } from "stack54/render";
import { type TemplateModule } from "stack54/types";

const components = import.meta.glob<TemplateModule>("../views/**/*.svelte");

export const resolver = (name: string) => {
  return resolve_component(`../views/${name}.svelte`, components);
};
