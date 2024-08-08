import type { ComponentType } from "svelte";
import { await as awaitter } from "stack54/render/streaming";

import Await from "./Await.svelte";

export function make<
  P extends Record<string, any>,
  T extends ComponentType<Await<P>>
>(Component: T): T {
  // @ts-expect-error
  if (Component.$$render) {
    // @ts-expect-error
    Component.$$render = function (
      result: any,
      props: any,
      bindings: any,
      slots: any
    ) {
      return awaitter({ slots, resolve: props.resolve });
    };

    return Component;
  }

  return Component;
}
