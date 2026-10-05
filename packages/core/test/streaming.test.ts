import { expect, it } from "vitest";

import { renderToStream, await as renderAwait } from "../src/runtime/render/streaming";
import type { Template } from "../src/types/template";

function make_template(resolve: PromiseLike<unknown>): Template {
  return {
    render() {
      const fallback = renderAwait({
        resolve,
        slots: {
          fallback: () => "loading",
          default: ({ value }) => String(value),
          error: ({ error }) => error.message,
        },
      });

      return {
        html: `<main>${fallback}</main>`,
        head: "",
        css: { code: "", map: null },
      };
    },
  };
}

it("should stop processing deferred renders when the stream is cancelled", async () => {
  let resolve: (value: string) => void = () => {};
  const deferred = new Promise<string>((done) => {
    resolve = done;
  });
  const stream = renderToStream(make_template(deferred));
  const reader = stream.getReader();
  const unhandled: unknown[] = [];
  const on_unhandled = (error: unknown) => unhandled.push(error);

  process.on("unhandledRejection", on_unhandled);
  try {
    const initial = await reader.read();
    expect(new TextDecoder().decode(initial.value)).toContain("loading");

    await reader.cancel();
    resolve("resolved");
    await new Promise((done) => setTimeout(done, 0));

    expect(unhandled).toEqual([]);
  } finally {
    process.off("unhandledRejection", on_unhandled);
  }
});

it("should stream resolved deferred content", async () => {
  const stream = renderToStream(make_template(Promise.resolve("ready")));
  const reader = stream.getReader();
  const output: string[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    output.push(new TextDecoder().decode(value));
  }

  expect(output.join("")).toContain("loading");
  expect(output.join("")).toContain("<template data-await=\"0\">ready</template>");
});
