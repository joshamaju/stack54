import {
  resolveComponent,
  createRenderer,
  renderToString,
} from "stack54/render";
import { type TemplateModule } from "stack54/types";

const components = import.meta.glob<TemplateModule>("../views/**/*.svelte", {
  eager: true,
});

const resolver = (name: string) => {
  return resolveComponent(`../views/${name}.svelte`, components);
};

export const render = createRenderer({
  resolve: resolver,
  render: (template, { props = {}, context }) => {
    return renderToString(template, { props, context });
  },
});
