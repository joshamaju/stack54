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

export function resolve_component<T>(
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

// /**
//  * @deprecated use {@link createRenderer} instead
//  */
// export function makeFactory<T extends Template | Promise<Template>>(
//   f: (name: string) => T
// ) {
//   return <V extends Views, K extends keyof V, O extends Options>(
//     name: K,
//     props?: V[K],
//     opts?: O
//   ): T extends Promise<Template>
//     ? Promise<O["stream"] extends true ? ReadableStream : string>
//     : O["stream"] extends true
//     ? ReadableStream
//     : string => {
//     // @ts-expect-error
//     const output = f(name);

//     const fn =
//       opts?.stream && opts.stream == true
//         ? renderToStream
//         : unsafe_render_to_string;

//     // @ts-expect-error
//     return output instanceof Promise
//       ? output.then((_) => fn(_, props as Props, opts))
//       : fn(output, props as Props, opts);
//   };
// }

type StreamMaybe<O extends Options> = O["stream"] extends true
  ? ReadableStream
  : string;

export function create_renderer<T extends Template | Promise<Template>>({
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

    // @ts-expect-error
    return is_template(template)
      ? render(template, opts)
      : template.then((t) => render(t, opts));
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
