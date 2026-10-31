import { render as render_component } from "svelte/server";
import type { Options, Props, Template } from "../../types/template.js";
import { HEAD_INSERTION_MARKER } from "../constants.js";

export function render(output: { body: string; head: string }) {
  return output.body.replace(HEAD_INSERTION_MARKER, output.head);
}

export function unsafe_render_to_string(
  template: Template,
  props?: Props,
  options?: Options
): string {
  return render(render_component(template, { props, context: options?.context }));
}

export { unsafe_render_to_string as renderToString };
