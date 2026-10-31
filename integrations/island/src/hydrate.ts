import { hydrate, unmount } from "svelte";
import type { Component } from "svelte";
import type { Callback } from "./directives/types.js";

class Island extends HTMLElement {
  hydrated = false;

  private instance?: Record<string, any>;

  // connectedCallback() {
  //   if (
  //     !this.hasAttribute("await-children") ||
  //     document.readyState === "interactive" ||
  //     document.readyState === "complete"
  //   ) {
  //     this.childrenConnectedCallback();
  //   } else {
  //     // connectedCallback may run *before* children are rendered (ex. HTML streaming)
  //     // If SSR children are expected, but not yet rendered, wait with a mutation observer
  //     // for a special marker inserted when rendering islands that signals the end of the island
  //     const onConnected = () => {
  //       document.removeEventListener("DOMContentLoaded", onConnected);
  //       mo.disconnect();
  //       this.childrenConnectedCallback();
  //     };

  //     const mo = new MutationObserver(() => {
  //       if (
  //         this.lastChild?.nodeType === Node.COMMENT_NODE &&
  //         this.lastChild.nodeValue === "astro:end"
  //       ) {
  //         this.lastChild.remove();
  //         onConnected();
  //       }
  //     });

  //     mo.observe(this, { childList: true });

  //     // in case the marker comment got stripped and the mutation observer waited indefinitely,
  //     // also wait for DOMContentLoaded as a last resort
  //     document.addEventListener("DOMContentLoaded", onConnected);
  //   }
  // }

  // childrenConnectedCallback() {
  //   this.hydrate();
  // }

  connectedCallback() {
    this.hydrate();
  }

  hydrate = () => {
    const file = this.getAttribute("file");
    const directive = this.getAttribute("directive");

    const load: Callback = window[file! as keyof Window];

    if (load === undefined) {
      window.addEventListener(`stack54:${directive}`, this.hydrate, {
        once: true,
      });
      return;
    }

    const parent = this.parentElement?.closest("stack54-island");

    // @ts-expect-error
    if (parent && !parent.hydrated) {
      parent.addEventListener("stack54:hydrate", this.hydrate, {
        once: true,
      });
      return;
    }

    const target = this;

    load((Component) => {
      import("stack54/data").then(({ parse }) => {
        const props = parse(this.getAttribute("props")!);
        this.instance = hydrate(Component as Component<any>, {
          target,
          props,
        });

        this.hydrated = true;
        this.dispatchEvent(new CustomEvent("stack54:hydrate"));
      });
    }, target);
  };

  disconnectedCallback() {
    if (this.instance) void unmount(this.instance);
  }
}

if (!customElements.get("stack54-island")) {
  customElements.define("stack54-island", Island);
}
