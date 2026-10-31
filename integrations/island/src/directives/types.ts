import type { Component } from "svelte";

export interface Callback {
  (fn: (arg: Component<any>) => void, node: HTMLElement): void | Promise<void>;
}

type Loader = () => Promise<{ default: Component<any> }>;

type Options = { value?: string };

export type Directive = (loader: Loader, options: Options) => Callback;
