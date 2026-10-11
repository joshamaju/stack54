export type Props = Record<string, any>;

/** Options shared by static and streaming template renderers. */
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
  /** Render a compiled Svelte template to its HTML, head, and collected CSS. */
  render(props?: Props, options?: Options): Output;
}

export interface TemplateModule {
  default: Template;
}
