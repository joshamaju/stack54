import { SvelteComponent } from "svelte";

interface Component {
  new (...args: any): SvelteComponent;
}

type Loader = () => Promise<{ default: Component }>;

export type Callback = (
  fn: (comp: Component) => void,
  node: HTMLElement
) => void | Promise<void>;

type Options = { value?: string; name: string };

export type Directive = (loader: Loader, options: Options) => Callback;
