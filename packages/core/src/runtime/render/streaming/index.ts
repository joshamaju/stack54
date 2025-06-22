import { AsyncLocalStorage } from "node:async_hooks";
import { Component, Snippet } from "svelte";
import { render } from "svelte/server";
import type { Options, Props, Template } from "../../../types/template.js";
import { HEAD_INSERTION_MARKER } from "../../constants.js";
import type { Chunk } from "./types.js";
import { isPromise, renderChunk, swap_script } from "./utils.js";

type Args = {
  context: Map<any, any>;
  component: Component<any>;
  props: {
    fallback: Snippet<[any]>;
    resolve: PromiseLike<unknown>;
    error: Snippet<[{ error: Error }]>;
    children: Snippet<[{ value: unknown }]>;
  };
};

const Storage = new AsyncLocalStorage<(arg: Args) => object>();

const await_ = (args: Args) => {
  const awaiter = Storage.getStore();
  return awaiter?.(args);
};

function render_to_stream(
  template: Template,
  args: { props: Props; context: Options["context"] }
) {
  let current_id = 0;
  const pending = new Set<Chunk["id"]>();

  let controller: ReadableStreamDefaultController<Chunk>;

  const stream = new ReadableStream<Chunk>({
    start(control) {
      controller = control;
    },
  });

  const suspend = ({ props, context, component }: Args) => {
    const id = current_id++;
    const { resolve } = props;

    const html = (component: Component, _props: any) => {
      const props_ = { ...props, internal: _props };
      const out = render(component, { context, props: props_ });
      return out.body.replace(HEAD_INSERTION_MARKER, out.head);
    };

    pending.add(id);

    const promise = isPromise(resolve) ? resolve : Promise.resolve(resolve);

    promise
      .then((value) => {
        const body = html(component, { value });
        controller.enqueue({ id, content: body });
      })
      .catch((error) => {
        const body = html(component, { error, state: "error" });
        controller.enqueue({ id, content: body });
      });

    return { internal: { id, state: "pending" } };
  };

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const cleanup = () => controller.close();

      const html = Storage.run(suspend, () => {
        const out = render(template, args);
        const head = out.head + swap_script;
        return out.body.replace(HEAD_INSERTION_MARKER, head);
      });

      controller.enqueue(encoder.encode(html));

      // Immediately close the stream if Await was not used.
      if (pending.size <= 0) cleanup();

      // @ts-ignore
      for await (const chunk of stream) {
        pending.delete(chunk.id);
        controller.enqueue(encoder.encode(renderChunk(chunk)));
        if (pending.size <= 0) cleanup();
      }
    },
  });
}

export { await_ as await };

export { render_to_stream as renderToStream };
