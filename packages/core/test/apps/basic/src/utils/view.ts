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

const resolver = (name: string) => {
  return resolveComponent(`../views/${name}.svelte`, components);
};

export const render = makeFactory(resolver);

export const render2 = createRenderer({
  resolve: resolver,
  render: (template, { props, ..._ }) => renderToString(template, props, _),
});
