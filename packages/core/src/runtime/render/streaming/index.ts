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

function render_to_stream(
  template: Template,
  ...args: Parameters<Template["render"]>
) {
  let current_id = 0;
  const pending = new Set<Chunk["id"]>();
  let cancelled = false;
  let failed = false;

  let controller: ReadableStreamDefaultController<Chunk>;
  let reader: ReadableStreamDefaultReader<Chunk> | undefined;

  const stream = new ReadableStream<Chunk>({
    start(control) {
      controller = control;
    },
    cancel() {
      cancelled = true;
    },
  });

  const enqueue = (chunk: Chunk) => {
    if (cancelled || failed) return;

    try {
      controller.enqueue(chunk);
    } catch (error) {
      failed = true;
      controller.error(error);
    }
  };

  const suspend = ({ slots, resolve }: Args) => {
    const id = current_id++;

    pending.add(id);

    const promise = isPromise(resolve) ? resolve : Promise.resolve(resolve);

    promise.then(
      (value) => {
        if (cancelled || failed) return;
        try {
          const name = (promise as any)["$$deferred"];
          const content = slots.default?.({ value }) ?? "";
          enqueue({ id, name, value, content });
        } catch (error) {
          failed = true;
          controller.error(error);
        }
      },
      (error) => {
        if (cancelled || failed) return;
        try {
          enqueue({
            id,
            content: slots.error?.({ error }) ?? String(error),
          });
        } catch (error) {
          failed = true;
          controller.error(error);
        }
      },
    );

    const fallback = slots.fallback?.({}) ?? "";

    return renderFallback({ id, content: fallback });
  };

  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const html = Storage.run(suspend, () => {
        const out = template.render(...args);
        const head = out.head + `<style>${out.css.code}</style>` + swap_script;
        return out.html.replace(HEAD_INSERTION_MARKER, head);
      });

      controller.enqueue(encoder.encode(html));

      if (pending.size <= 0) {
        controller.close();
        return;
      }

      reader = stream.getReader();
      try {
        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;

          pending.delete(value.id);
          controller.enqueue(encoder.encode(renderChunk(value)));
          if (pending.size <= 0) {
            controller.close();
            break;
          }
        }
      } finally {
        reader.releaseLock();
        reader = undefined;
      }
    },
    cancel(reason) {
      cancelled = true;
      return reader?.cancel(reason);
    },
  });
}

export { await_ as await };

export { render_to_stream as renderToStream };
