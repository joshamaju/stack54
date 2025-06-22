import { getAllContexts, type Component, type ComponentProps } from "svelte";
import { await as awaitter } from "stack54/render/streaming";

import Await from "./Await.svelte";

export function make<T extends ComponentProps<Await>>(
  component: Component<T>
): Component<T> {
  return ($$payload: any, $$props: any) => {
    const context = getAllContexts();
    const props = awaitter({ context, props: $$props, component });
    return component($$payload, { ...$$props, ...props });
  };
}
