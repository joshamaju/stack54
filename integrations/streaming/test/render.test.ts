import { describe, it, expect } from "vitest";
import streamingIntegration from "../src/plugin.js";

// // Mock Template
// const createMockTemplate = (renderFn: any) => ({
//   render: renderFn,
// });

// describe("render_to_stream", () => {
//   it("should yield initial HTML", async () => {
//     const template = createMockTemplate(() => ({
//       html: "<div>Hello</div>",
//       head: "",
//       css: { code: "" },
//     }));

//     const stream = renderToStream(template as any);
//     const chunks: string[] = [];
//     for await (const chunk of stream) {
//       chunks.push(chunk);
//     }

//     expect(chunks.length).toBe(1);
//     expect(chunks[0]).toContain("<div>Hello</div>");
//   });

//   it("should handle async components with fallback", async () => {
//     const slots = {
//       default: ({ value }: any) => `<div>Async: ${value}</div>`,
//       fallback: () => `<div>Loading...</div>`,
//     };

//     const resolve = new Promise((r) => setTimeout(() => r("Data"), 10));

//     const template = createMockTemplate(() => {
//       // simulate usage of await_
//       const fallback = await_({ slots, resolve } as any);
//       return {
//         html: `<div>${fallback}</div>`,
//         head: "",
//         css: { code: "" },
//       };
//     });

//     const stream = renderToStream(template as any);
//     const chunks: string[] = [];

//     for await (const chunk of stream) {
//       chunks.push(chunk);
//     }

//     expect(chunks.length).toBe(2);
//     expect(chunks[0]).toContain("Loading...");
//     expect(chunks[1]).toContain("Async: Data");
//   });

//   it("should handle async errors", async () => {
//     const slots = {
//       default: ({ value }: any) => `<div>Async: ${value}</div>`,
//       error: ({ error }: any) => `<div>Error: ${error}</div>`,
//     };

//     const resolve = new Promise((_, reject) =>
//       setTimeout(() => reject("Failed"), 10)
//     );

//     const template = createMockTemplate(() => {
//       const fallback = await_({ slots, resolve } as any);
//       return {
//         html: `<div>${fallback}</div>`,
//         head: "",
//         css: { code: "" },
//       };
//     });

//     const stream = renderToStream(template as any);
//     const chunks: string[] = [];

//     for await (const chunk of stream) {
//       chunks.push(chunk);
//     }

//     expect(chunks.length).toBe(2);
//     expect(chunks[1]).toContain("Error: Failed");
//   });
// });

it("transforms nested await blocks without overlapping edits", async () => {
  const integration = streamingIntegration();
  const configured = integration.config?.({} as any, { command: "build" });
  const plugin = (configured as any).vite.plugins[0];
  integration.configResolved?.({ svelte: { preprocess: [] } } as any);

  const result = await plugin.transform.handler(
    `<script>export let outer;</script>
{#await outer}<p>pending</p>
{:then outerValue}
  {#await outerValue.inner}<span>inner pending</span>
  {:then innerValue}<b>{innerValue}</b>{/await}
{/await}`,
    "/src/nested.svelte",
    { ssr: true },
  );

  expect(result.code.match(/<Await_\d+ resolve=/g)).toHaveLength(2);
  expect(result.code).toContain("inner pending");
});
