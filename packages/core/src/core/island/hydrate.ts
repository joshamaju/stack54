import { decode } from "stack54/data";
import { Callback } from "./directives/types.js";

export function hydrate(load: Callback) {
  class Island extends HTMLElement {
    connectedCallback() {
      load((Component) => {
        const props = decode(this.getAttribute("key")!) as any;
        new Component({ props, target: this, hydrate: true });
      });
    }
  }

  if (!customElements.get("stack54-island")) {
    customElements.define("stack54-island", Island);
  }
}
