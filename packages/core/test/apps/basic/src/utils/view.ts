import {
  makeFactory,
  resolveComponent,
  createRenderer,
  renderToString,
} from "stack54/render";
import { type TemplateModule } from "stack54/types";

const components = import.meta.glob<TemplateModule>("../views/**/*.svelte", {
  eager: true,
});

export const render = makeFactory((name) => {
  return resolveComponent(`../views/${name}.svelte`, components);
});

export const render2 = createRenderer({
  render: (template, { props, ...opts }) =>
    renderToString(template, props, opts),
  resolve: (name) => resolveComponent(`../views/${name}.svelte`, components),
});
