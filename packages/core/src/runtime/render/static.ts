import { render as render_ } from "svelte/server";
import type { Options, Output, Props, Template } from "../../types/template.js";
import { HEAD_INSERTION_MARKER } from "../constants.js";

export function render(output: Output) {
  return output.body.replace(HEAD_INSERTION_MARKER, output.head);
}

export function unsafe_render_to_string(
  template: Template | Output | any,
  args: { props: Props; context: Options["context"] }
): string {
  let output: Output;

  if ("body" in template) {
    output = template;
  } else {
    output = render_(template, args);
  }

  return render(output);
}

export { unsafe_render_to_string as renderToString };
