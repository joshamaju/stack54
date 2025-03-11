import { SvelteComponent_1 } from "svelte";

import type {
  Options,
  Props,
  Template,
  TemplateModule,
} from "../../types/template.js";

type Lazy<T> = () => Promise<T>;

const is_lazy = <T>(value: any): value is Lazy<T> => {
  return typeof value == "function";
};

function resolve_component<T>(
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
  return is_lazy(entry) ? entry().then((_) => _.default) : entry.default;
}

export interface Views {}

type StreamMaybe<O extends Options> = O["stream"] extends true
  ? ReadableStream
  : string;

function create_renderer<T extends Template | Promise<Template>>({
  render,
  resolve,
}: {
  resolve(path_like: string): T;
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
      ? Promise<StreamMaybe<O>>
      : StreamMaybe<O>
    : StreamMaybe<O> => {
    const template = (
      typeof path_or_template == "string"
        ? resolve(path_or_template)
        : path_or_template
    ) as Template | Promise<Template>;

    const { stream = false, ..._ } = options ?? {};

    const opts = { ..._, props, stream };

    // @ts-ignore
    return is_template(template)
      ? // @ts-ignore
        render(template, opts)
      : // @ts-ignore
        template.then((t) => render(t, opts));
  };
}

export function is_template(value: unknown): value is Template {
  return (
    value !== null &&
    typeof value == "object" &&
    "render" in value &&
    typeof value.render == "function"
  );
}

export {
  create_renderer as createRenderer,
  resolve_component as resolveComponent,
};
