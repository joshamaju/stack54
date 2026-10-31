import type { Component } from "svelte";

export type Props = Record<string, any>;

/** Options shared by static and streaming template renderers. */
export type Options = {
  stream?: boolean;
  context?: Map<string, unknown>;
};

/** Svelte 5 component values are functions rendered with `svelte/server`. */
export type Template<Props extends Record<string, any> = Record<string, any>> =
  Component<Props>;

export interface TemplateModule {
  default: Template;
}
