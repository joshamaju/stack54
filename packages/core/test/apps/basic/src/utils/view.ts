import {
  resolve_component,
  create_renderer,
  renderToString,
} from "stack54/render";
import { type TemplateModule } from "stack54/types";

const components = import.meta.glob<TemplateModule>("../views/**/*.svelte", {
  eager: true,
});

const resolver = (name: string) => {
  return resolve_component(`../views/${name}.svelte`, components);
};

export const render = create_renderer({
  resolve: resolver,
  render: (template, { props, ..._ }) => renderToString(template, props, _),
});
