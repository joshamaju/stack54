import { SvelteComponent } from "svelte";

interface Component {
  new (...args: any): SvelteComponent;
}

type Loader = () => Promise<{ default: Component }>;

export type Callback = (fn: (comp: Component) => void) => void | Promise<void>;

export type Directive = (loader: Loader) => Callback;
