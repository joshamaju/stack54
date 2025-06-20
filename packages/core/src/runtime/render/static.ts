import type { Options, Output, Props, Template } from "../../types/template.js";
import { HEAD_INSERTION_MARKER } from "../constants.js";
import { is_template } from "./utils.js";
import { render as render_ } from "svelte/server";

export function render(output: Output) {
  return output.body.replace(HEAD_INSERTION_MARKER, output.head);
}

export function unsafe_render_to_string(
  template: Template | Output | any,
  args: { props: Props; context: Options["context"] }
): string {
  let output: Output;

  if ("html" in template) {
    output = template;
  } else {
    if (is_template(template)) {
      output = render_(template, args);
    } else {
      throw new Error("Not a valid SSR component");
    }
  }

  return render(output);
}

export { unsafe_render_to_string as renderToString };
