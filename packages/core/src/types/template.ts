import { Component } from "svelte";

export type Props = Record<string, any>;

export type Options = {
  stream?: boolean;
  context?: Map<string, unknown>;
};

export interface Output {
  body: string;
  head: string;
}

export type Template = Component;

export interface TemplateModule {
  default: Template;
}
