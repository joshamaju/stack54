import type {
  Options,
  Output,
  Props,
  Template,
  TemplateModule,
} from "../../types/template.js";

import { HEAD_INSERTION_MARKER } from "../constants.js";
import { renderToStream } from "./streaming/index.js";

export * from "./streaming/index.js";

export interface Views {}

type Lazy<T> = () => Promise<T>;

export function render(output: Output) {
  const head = output.head + `<style>${output.css.code}</style>`;
  return output.html.replace(HEAD_INSERTION_MARKER, head);
}

export function unsafeRenderToString(
  template: Template | Output | any,
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
  template: Template | any,
  ...args: Parameters<Template["render"]>
) {
  return unsafeRenderToString(template, ...args);
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
  return <V extends Views, K extends keyof V, O extends Options>(
    name: K,
    props?: V[K],
    opts?: O
  ): T extends Promise<Template>
    ? Promise<O["stream"] extends true ? ReadableStream : string>
    : O["stream"] extends true
    ? ReadableStream
    : string => {
    // @ts-expect-error
    const output = f(name);

    const fn =
      opts?.stream && opts.stream == true
        ? renderToStream
        : unsafeRenderToString;

    // @ts-expect-error
    return output instanceof Promise
      ? output.then((_) => fn(_, props as Props, opts))
      : fn(output, props as Props, opts);
  };
}
