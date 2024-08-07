import type { Express } from "express";

import { makeLocals } from "stack54/locals";
import { isErr, makeFactory, unsafeMakeFactory } from "stack54/render";

export const register = (
  app: Express,
  fn: ReturnType<typeof makeFactory> | ReturnType<typeof unsafeMakeFactory>
) => {
  app.use((_, __, next) => {
    const renderer = app.render;

    app.render = async function (name, options) {
      let done;
      let opts = options;
      let render_options: Record<string, any> = {};

      // support callback function as second arg
      if (typeof options === "function") {
        done = options;
        opts = {};
      } else if (typeof arguments[2] === "function") {
        done = arguments[2];
      }

      // merge app.locals
      render_options = { ...render_options, ...this.locals };

      // merge options._locals
      // @ts-expect-error
      if (opts?._locals) {
        // @ts-expect-error
        render_options = { ...render_options, ...opts._locals };
      }

      // merge options
      render_options = { ...render_options, ...opts };

      const locals = makeLocals({ ...render_options._locals });

      const context = new Map<string, any>([
        ...locals,
        // @ts-expect-error
        ...(opts?.context ?? new Map()),
      ]);

      try {
        // @ts-expect-error
        const view = await fn(name, render_options, { context });

        if (typeof view !== "string") {
          if (isErr(view)) {
            return done?.(view.left);
          }

          done?.(null, view.right);
          return;
        }

        done?.(null, view);
      } catch (error) {
        done?.(error);
      }
    };

    next();
  });
};
