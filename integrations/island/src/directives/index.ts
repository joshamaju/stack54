import type { Directive } from "./types.js";

export const load: Directive = (loader) => {
  return async (hydrate) => {
    const component = await loader();
    hydrate(component.default);
  };
};

// https://github.com/withastro/astro/blob/main/packages/astro/src/runtime/client/idle.ts
export const idle: Directive = (load) => {
  return (hydrate) => {
    const cb = async () => {
      const component = await load();
      hydrate(component.default);
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(cb);
    } else {
      setTimeout(cb, 200);
    }
  };
};

/**
 * Hydrate this component when a matching media query is found
 *
 * https://github.com/withastro/astro/blob/main/packages/astro/src/runtime/client/media.ts
 */
export const media: Directive = (load, options) => {
  return (hydrate) => {
    const cb = async () => {
      const component = await load();
      hydrate(component.default);
    };

    if (options.value) {
      const mql = matchMedia(options.value);

      if (mql.matches) {
        cb();
      } else {
        mql.addEventListener("change", cb, { once: true });
      }
    }
  };
};

type ClientVisibleOptions = Pick<
  IntersectionObserverInit,
  "rootMargin" | "threshold"
>;

/**
 * Hydrate this component when one of it's children becomes visible
 * We target the children because `astro-island` is set to `display: contents`
 * which doesn't work with IntersectionObserver
 *
 * https://github.com/withastro/astro/blob/main/packages/astro/src/runtime/client/visible.ts#L8
 */
export const visible: Directive = (load, options) => {
  return (hydrate, node) => {
    const cb = async () => {
      const component = await load();
      hydrate(component.default);
    };

    const str_opts = options.value?.split(",");

    const raw_opts = str_opts?.map((opt) => {
      const [k, v] = opt.split("=");
      return [`"${k}": "${v}"`];
    });

    const opts = raw_opts
      ? (JSON.parse(`{${raw_opts?.join(",")}}`) as ClientVisibleOptions)
      : undefined;

    const ioOptions: IntersectionObserverInit = {
      rootMargin: opts?.rootMargin,
      threshold: opts?.threshold,
    };

    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        // As soon as we hydrate, disconnect this IntersectionObserver for every `astro-island`
        io.disconnect();
        cb();
        break; // break loop on first match
      }
    }, ioOptions);

    for (const child of node.children) {
      io.observe(child);
    }
  };
};
