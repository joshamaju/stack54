import type { Callback } from "./directives/types.js";

export function hydrate(load: Callback) {
  class Island extends HTMLElement {
    connectedCallback() {
      load((Component) => {
        import("stack54/data").then(({ raw_decode }) => {
          const props = raw_decode(this.getAttribute("props")!) as any;
          console.log(props);
          new Component({ props, target: this, hydrate: true });
          const event = new Event("hydrate");
        });
      }, this);
    }
  }

  if (!customElements.get("stack54-island")) {
    customElements.define("stack54-island", Island);
  }
}
