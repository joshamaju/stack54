// import { renderToStream } from "@stack54/streaming/render";
import { renderToStream } from "stack54/render";
import type { MiddlewareHandler } from "hono";
import { stream } from "hono/streaming";
import { key, makeLocals } from "stack54/locals";
import { resolver } from "./view";

declare module "hono" {
  interface ContextRenderer {
    (content: string, props?: object): Response;
  }
}

export const renderer = (): MiddlewareHandler => {
  return async (ctx, next) => {
    ctx.setRenderer((name, props) => {
      const locals = makeLocals(ctx.get(key));
      const context = new Map([...locals.entries()]);

      const template = resolver(name);

      const _stream = renderToStream(template, props, { context });

      // let controller: ReadableStreamDefaultController<string> | undefined;

      // const _stream = new ReadableStream({
      //   start(_controller) {
      //     controller = _controller;
      //   },
      // });

      // (async () => {
      //   const stream = renderToStream(template, props, { context });
      //   for await (const chunk of stream) controller?.enqueue(chunk);
      //   controller?.close();
      // })();

      return stream(ctx, async (_) => {
        await _.pipe(_stream);
      });
    });

    await next();
  };
};
