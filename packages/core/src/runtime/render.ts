import * as Either from "effect/Either";

import { Output, Props, Template, TemplateModule } from "../types/template.js";
import { HEAD_INSERTION_MARKER } from "./constants.js";

export interface Views {}

type Lazy<T> = () => Promise<T>;

export class RenderError {
  readonly _tag = "RenderError";
  constructor(public cause: unknown) {}
}

export function render(output: Output) {
  const head = output.head + `<style>${output.css.code}</style>`;
  return output.html.replace(HEAD_INSERTION_MARKER, head);
}

export function unsafeRenderToString(
  template: Template | Output,
  ...args: Parameters<Template["render"]>
): string {
  let output: Output;

  if ("html" in template) {
    output = template;
  } else {
    if ("render" in template && typeof template.render == "function") {
      output = template.render(...args);
    } else {
      throw new Error("Not a valid SSR component");
    }
  }

  return render(output);
}

export function renderToString(
  template: Template,
  ...args: Parameters<Template["render"]>
) {
  return Either.try({
    try: () => unsafeRenderToString(template, ...args),
    catch: (e) => new RenderError(e),
  });
}

const isLazy = <T>(value: any): value is Lazy<T> => {
  return typeof value == "function";
};

export function resolveComponent<T>(
  path: string,
  components: T
): T extends Record<string, infer R>
  ? R extends Lazy<infer R1>
    ? R1 extends TemplateModule
      ? Promise<Template>
      : never
    : R extends TemplateModule
    ? Template
    : never
  : never {
  const components_ = components as Record<
    string,
    TemplateModule | Lazy<TemplateModule>
  >;
  const entry = components_[path];
  // @ts-expect-error
  return isLazy(entry) ? entry().then((_) => _.default) : entry.default;
}

export function makeFactory<T extends Template | Promise<Template>>(
  f: (name: string) => T
) {
  return <V extends Views, K extends keyof V>(
    name: K,
    props?: V[K]
  ): T extends Promise<Template> ? Promise<string> : string => {
    // @ts-expect-error
    const output = f(name);
    // @ts-expect-error
    return output instanceof Promise
      ? output.then((_) => unsafeRenderToString(_, props as Props))
      : unsafeRenderToString(output, props as Props);
  };
}
