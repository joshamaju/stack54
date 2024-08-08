export type Props = Record<string, any>;

export type Options = {
  stream?: boolean;
  context?: Map<string, unknown>;
};

export interface Output {
  html: string;
  head: string;
  css: { map: any; code: string };
}

export interface Template {
  render(props?: Props, options?: Options): Output;
}

export interface TemplateModule {
  default: Template;
}
