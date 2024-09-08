import { AsyncLocalStorage } from "node:async_hooks";

import type { Chunk } from "./types.js";
import type { Template } from "../../../types/template.js";
import { HEAD_INSERTION_MARKER } from "../../constants.js";
import {
  isPromise,
  renderChunk,
  renderFallback,
  swap_script,
} from "./utils.js";

type Slot<T = any> = (props: T) => string;

interface Slots {
  fallback: Slot;
  error: Slot<{ error: Error }>;
  default: Slot<{ value: unknown }>;
}

type Args = { slots: Slots; resolve: PromiseLike<unknown> };

const Storage = new AsyncLocalStorage<(arg: Args) => void>();

const await_ = (args: Args) => {
  const awaiter = Storage.getStore();
  return awaiter?.(args);
};

export function renderToStream(
  template: Template,
  ...args: Parameters<Template["render"]>
) {
  let current_id = 0;
  const pending = new Set<Chunk["id"]>();

  let controller: ReadableStreamDefaultController<Chunk>;

  const stream = new ReadableStream<Chunk>({
    start(control) {
      controller = control;
    },
  });

  const suspend = ({ slots, resolve }: Args) => {
    const id = current_id++;

    pending.add(id);

    const promise = isPromise(resolve) ? resolve : Promise.resolve(resolve);

    promise
      .then((value) => {
        controller.enqueue({ id, content: slots.default?.({ value }) ?? "" });
      })
      .catch((error) => {
        controller.enqueue({
          id,
          content: slots.error?.({ error }) ?? String(error),
        });
      });

    const fallback = slots.fallback?.({}) ?? "";

    return renderFallback({ id, content: fallback });
  };

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const cleanup = () => controller.close();

      const html = Storage.run(suspend, () => {
        const out = template.render(...args);
        const head = out.head + `<style>${out.css.code}</style>` + swap_script;
        return out.html.replace(HEAD_INSERTION_MARKER, head);
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
