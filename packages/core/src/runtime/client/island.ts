import { decode } from "stack54/data";
import { SvelteComponent } from "svelte";

// class Stack54Island extends HTMLElement {
//   connectedCallback() {
//     // const shadow = this.attachShadow({ mode: "open" });
//     const id = this.getAttribute("key")!;
//     const file = this.getAttribute("file")!;

//     const props = decode(id) as any;
//     const target = document.querySelector(`#${id}-el`)!;

//     console.log(
//       "id: ",
//       id,
//       file,
//       props,
//       window[`${file}` as any],
//       `window[${file}]`
//     );

//     // // @ts-expect-error
//     // new window[id as any]({ props, target: this, hydrate: true });
//   }
// }

// customElements.define("stack54-island", Stack54Island);

export function hydrate(component: any) {
  class Island extends HTMLElement {
    connectedCallback() {
      const id = this.getAttribute("key")!;
      const props = decode(id) as any;
      new component({ props, target: this, hydrate: true });
    }
  }

  if (!customElements.get("stack54-island")) {
    customElements.define("stack54-island", Island);
  }
}
