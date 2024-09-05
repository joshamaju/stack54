import type { Express, Handler } from "express";

import { makeLocals } from "stack54/locals";
import { makeFactory } from "stack54/render";

export const register = (app: Express, fn: ReturnType<typeof makeFactory>) => {
  app.use((_, res, next) => {
    app.render = async function (name, options) {
      let done;
      let opts = typeof options === "function" ? {} : options;

      // support callback function as second arg
      if (typeof options === "function") {
        done = options;
      } else if (typeof arguments[2] === "function") {
        done = arguments[2];
      }

      let render_opts: Record<string, any> = opts || {};

      render_opts._locals = { ...this.locals, ...render_opts._locals };

      const { _locals, stream: s, ...props } = render_opts;

      const locals = makeLocals({ ..._locals });

      const context = new Map<string, any>([
        ...locals,
        ...(render_opts.context ?? new Map()),
      ]);

      const stream: boolean | undefined = s;

      try {
        // @ts-expect-error
        const view = await fn(name, props, { context, stream });

        if (stream == true) {
          const { Readable } = await import("node:stream");
          const stream = Readable.fromWeb(view as any);
          res.setHeader("Transfer-Encoding", "chunked");
          res.setHeader("Content-Type", "text/html");
          return stream.pipe(res);
        }

        done?.(null, view);
      } catch (error) {
        done?.(error);
      }
    };

    next();
  });
};

export const middleware = (fn: ReturnType<typeof makeFactory>): Handler => {
  return function (req, res, next) {
    res.render = async function (name, options) {
      let done;
      let opts = typeof options === "function" ? {} : options;

      // support callback function as second arg
      if (typeof options === "function") {
        done = options;
      } else if (typeof arguments[2] === "function") {
        done = arguments[2];
      }

      let render_options: Record<string, any> = opts || {};

      render_options._locals = { ...this.locals, ...render_options?._locals };

      const { _locals, stream: s, ...props } = render_options;

      const locals = makeLocals({ ..._locals });

      const context = new Map<string, any>([
        ...locals,
        ...(render_options?.context ?? new Map()),
      ]);

      const stream: boolean | undefined = s;

      // default callback to respond
      done =
        done ||
        ((err: unknown, str: string) => {
          if (err) return req.next?.(err);
          this.send(str);
        });

      try {
        // @ts-expect-error
        const view = await fn(name, props, { context, stream });

        if (stream == true) {
          const { Readable } = await import("node:stream");
          const stream = Readable.fromWeb(view as any);
          this.setHeader("Transfer-Encoding", "chunked");
          this.setHeader("Content-Type", "text/html");
          return stream.pipe(res);
        }

        done?.(null, view);
      } catch (error) {
        done?.(error);
      }
    };

    next();
  };
};
