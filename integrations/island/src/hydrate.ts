import type { SvelteComponent } from "svelte";
import type { Callback } from "./directives/types.js";

export function hydrate(load: Callback) {
  class Island extends HTMLElement {
    private instance?: SvelteComponent<any, any, any>;

    connectedCallback() {
      const target = this;

      load((Component) => {
        import("stack54/data").then(({ raw_decode }) => {
          const props = raw_decode(this.getAttribute("props")!) as any;
          this.instance = new Component({ props, target, hydrate: true });
        });
      }, target);
    }

    disconnectedCallback() {
      this.instance?.$destroy();
    }
  }

  if (!customElements.get("stack54-island")) {
    customElements.define("stack54-island", Island);
  }
}
