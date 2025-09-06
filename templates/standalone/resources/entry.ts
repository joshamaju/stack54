export { renderToString } from "stack54/render/static";

import { resolveComponent } from "stack54/render/utils";
import { type TemplateModule } from "stack54/types";

const components = import.meta.glob<TemplateModule>("./views/**/*.page.svelte");

export const resolver = (name: string) => {
  return resolveComponent(
    [`./views/${name}`, `./views/${name}.page.svelte`],
    components,
  );
};
