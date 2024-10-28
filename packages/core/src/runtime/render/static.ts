import type { Output, Template } from "../../types/template.js";
import { HEAD_INSERTION_MARKER } from "../constants.js";
import { is_template } from "./utils.js";

export function render(output: Output) {
  const head = output.head + `<style>${output.css.code}</style>`;
  return output.html.replace(HEAD_INSERTION_MARKER, head);
}

export function unsafe_render_to_string(
  template: Template | Output | any,
  ...args: Parameters<Template["render"]>
): string {
  let output: Output;

  if ("html" in template) {
    output = template;
  } else {
    if (is_template(template)) {
      output = template.render(...args);
    } else {
      throw new Error("Not a valid SSR component");
    }
  }

  return render(output);
}

export { unsafe_render_to_string as renderToString };
