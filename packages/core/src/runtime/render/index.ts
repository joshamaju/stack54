import { SvelteComponent_1 } from "svelte";

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

export function isTemplate(value: unknown): value is Template {
  return (
    value !== null &&
    typeof value == "object" &&
    "render" in value &&
    typeof value.render == "function"
  );
}

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
  path: string | string[],
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

  const path_ = Array.isArray(path)
    ? Object.keys(components_).find((entry) => path.includes(entry))
    : path;

  if (!path_) throw new Error("Template not found");

  const entry = components_[path_];
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

type Streamable<O extends Options> = O["stream"] extends true
  ? ReadableStream
  : string;

export function createRenderer<T extends Template | Promise<Template>>({
  render,
  resolve,
}: {
  resolve: (path_like: string) => T;
  render(
    template: Template | any,
    options: { props?: Props } & Options
  ): ReadableStream | string;
}) {
  return <
    P extends string | Template | { new (...args: any[]): SvelteComponent_1 },
    O extends Options
  >(
    path_or_template: P,
    props?: Props,
    options?: O
  ): P extends string
    ? T extends Promise<Template>
      ? Promise<Streamable<O>>
      : Streamable<O>
    : Streamable<O> => {
    const template = (
      typeof path_or_template == "string"
        ? resolve(path_or_template)
        : path_or_template
    ) as Template | Promise<Template>;

    const { stream = false, ..._ } = options ?? {};

    const opts = { ..._, props, stream };

    // @ts-expect-error
    return isTemplate(template)
      ? render(template, opts)
      : template.then((t) => render(t, opts));
  };
}
