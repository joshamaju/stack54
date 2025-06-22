import { createRawSnippet, hydrate, unmount } from "svelte";
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

  private hydrate = () => {
    const file = this.getAttribute("file");
    const directive = this.getAttribute("directive");

    const load: Callback = window[file! as keyof Window];

    if (load === undefined) {
      window.addEventListener(`stack54:${directive}`, this.hydrate, {
        once: true,
      });
      return;
    }

    let parent = this.closest("stack54-island");

    if (this.isSameNode(parent)) {
      parent = parent?.parentElement?.closest("stack54-island") || null;
    }

    // @ts-expect-error
    if (parent && !parent.hydrated) {
      parent.addEventListener("stack54:hydrate", this.hydrate, { once: true });
      return;
    }

    const target = this;

    load((Component) => {
      import("stack54/data").then(({ parse }) => {
        const props = parse(this.getAttribute("props")!);
        const slots = this.querySelectorAll("stack54-slot");

        const slotted: Array<[string, Element]> = [];

        for (let slot of slots) {
          const closest = slot.closest(this.tagName);
          if (!closest?.isSameNode(this)) continue;
          const name = slot.getAttribute("name") || "children";
          slotted.push([name, slot]);
        }

        const _props = {
          ...props,
          ...Object.fromEntries(
            slotted.map(([k, slot]) => [
              k,
              createRawSnippet(() => {
                return {
                  render() {
                    // Remove comments to avoid [issue](https://svelte.dev/docs/svelte/runtime-warnings#Client-warnings-hydration_mismatch)
                    return slot.innerHTML.replace(/<!--[\s\S]*?-->/g, "");
                  },
                  setup(element) {
                    return () => console.log("destroy");
                  },
                };
              }),
              // (anchor: Comment) => {
              //   anchor.replaceWith(slot);
              //   return () => slot.remove();
              // },
            ])
          ),
        };

        const opts = { target, props: _props, $$inline: true };
        this.instance = hydrate(Component, opts);

        this.hydrated = true;
        this.dispatchEvent(new CustomEvent("stack54:hydrate"));
      });
    }, target);
  };

  disconnectedCallback() {
    if (this.instance) {
      unmount(this.instance);
    }
  }
}

if (!customElements.get("stack54-island")) {
  customElements.define("stack54-island", Island);
}
