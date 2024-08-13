import { Directive } from "./types.js";

export const load: Directive = (loader) => {
  return async (hydrate) => {
    const component = await loader();
    hydrate(component.default);
  };
};

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
