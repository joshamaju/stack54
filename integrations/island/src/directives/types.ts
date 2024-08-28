import { SvelteComponent } from "svelte";

interface Component {
  new (...args: any): SvelteComponent;
}

export interface Callback {
  (fn: (arg: Component) => void, node: HTMLElement): void | Promise<void>;
}

type Loader = () => Promise<{ default: Component }>;

type Options = { value?: string };

export type Directive = (loader: Loader, options: Options) => Callback;
