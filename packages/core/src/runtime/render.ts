import * as Either from "effect/Either";

import {
  Options,
  Output,
  Props,
  Template,
  TemplateModule,
} from "../types/template.js";
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

export function unsafeMakeFactory<T extends Template | Promise<Template>>(
  f: (name: string) => T
) {
  return <V extends Views, K extends keyof V>(
    name: K,
    props?: V[K],
    opts?: Options
  ): T extends Promise<Template> ? Promise<string> : string => {
    // @ts-expect-error
    const output = f(name);
    // @ts-expect-error
    return output instanceof Promise
      ? output.then((_) => unsafeRenderToString(_, props as Props, opts))
      : unsafeRenderToString(output, props as Props, opts);
  };
}

export function makeFactory<T extends Template | Promise<Template>>(
  f: (name: string) => T
) {
  return <V extends Views, K extends keyof V>(
    name: K,
    props?: V[K],
    opts?: Options
  ): T extends Promise<Template>
    ? Promise<Either.Either<string, RenderError>>
    : Either.Either<string, RenderError> => {
    // @ts-expect-error
    const output = f(name);
    // @ts-expect-error
    return output instanceof Promise
      ? output.then((_) => renderToString(_, props as Props, opts))
      : renderToString(output, props as Props, opts);
  };
}

export const isOk = (
  result: Either.Either<string, RenderError>
): result is Either.Right<RenderError, string> => {
  return Either.isRight(result);
};

export const isErr = (
  result: Either.Either<string, RenderError>
): result is Either.Left<RenderError, string> => {
  return Either.isLeft(result);
};
