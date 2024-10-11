import type { Handler } from "express";

import { makeLocals } from "stack54/locals";
import { makeFactory } from "stack54/render";

export default function middleware(
  fn: ReturnType<typeof makeFactory>
): Handler {
  return function (req, res, next) {
    res.render = async function (name, options) {
      let done;
      let opts = typeof options === "function" ? {} : options;

      if (typeof options === "function") {
        done = options;
      } else if (typeof arguments[2] === "function") {
        done = arguments[2];
      }

      let _opts: Record<string, any> = opts || {};

      _opts._locals = { ...this.locals, ..._opts?._locals };

      const { _locals, stream: s, ...props } = _opts;

      const locals = makeLocals({ ..._locals });

      const context = new Map<string, any>([
        ...locals,
        ...(_opts?.context ?? new Map()),
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

          if (!this.hasHeader("Transfer-Encoding")) {
            this.setHeader("Transfer-Encoding", "chunked");
          }

          if (!this.hasHeader("Content-Type")) {
            this.setHeader("Content-Type", "text/html");
          }

          return stream.pipe(res);
        }

        done?.(null, view);
      } catch (error) {
        done?.(error);
      }
    };

    next();
  };
}
