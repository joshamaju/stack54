import { SvelteComponent } from "svelte";
import type { Callback } from "./directives/types.js";

// @ts-expect-error no export type definition
import { detach, insert, noop } from "svelte/internal";

// https://github.com/lukeed/freshie/blob/5930c2eb8008aac93dcdad1da730e620db327072/packages/%40freshie/ui.svelte/index.js#L20
function slotty(elem: Element | Comment) {
  return function (...args: any[]) {
    let frag: any = {};

    frag.c = frag.c || noop;
    frag.l = frag.l || noop;

    frag.m =
      frag.m ||
      function (target: any, anchor: any) {
        insert(target, elem, anchor);
      };

    frag.d =
      frag.d ||
      function (detaching: any) {
        if (detaching) detach(elem);
      };

    return frag;
  };
}

class Island extends HTMLElement {
  hydrated = false;

  private instance?: SvelteComponent<any, any, any>;

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
      import("stack54/data").then(({ raw_decode }) => {
        const props = raw_decode(this.getAttribute("props")!);
        const slots = this.querySelectorAll("stack54-slot");

        const slotted: Array<[string, Element]> = [];

        for (let slot of slots) {
          const closest = slot.closest(this.tagName);
          if (!closest?.isSameNode(this)) continue;
          const name = slot.getAttribute("name") || "default";
          slotted.push([name, slot]);
        }

        const _props = {
          ...props,
          $$scope: {},
          $$slots: Object.fromEntries(
            slotted.map(([k, _]) => [k, [slotty(_ as any)]])
          ),
        };

        const opts = { target, props: _props, hydrate: true, $$inline: true };
        this.instance = new Component(opts);

        this.hydrated = true;
        this.dispatchEvent(new CustomEvent("stack54:hydrate"));
      });
    }, target);
  };

  disconnectedCallback() {
    this.instance?.$destroy();
  }
}

if (!customElements.get("stack54-island")) {
  customElements.define("stack54-island", Island);
}
