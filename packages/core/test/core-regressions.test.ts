import { expect, it } from "vitest";
import { parse } from "devalue";

import { collect_assets } from "../src/core/build/compiler";
import { attach_full_path } from "../src/core/dev/attach-full-path";
import { resolve } from "../src/core/utils/integration";
import { encode } from "../src/runtime/data";

it("collects each nested asset exactly once", () => {
  const assets = collect_assets(
    `<main><script src="./app.js"></script><section><link href="./app.css"></section></main>`,
    "src/views/home.svelte",
  );

  expect(assets.map((asset) => asset.name)).toEqual(["script", "link"]);
});

it("rewrites each nested local asset once", async () => {
  const preprocessor = attach_full_path({});
  const result = await preprocessor.markup!({
    content: `<main><section><img src="./image.png"></section></main>`,
    filename: "/project/src/views/home.svelte",
  });

  expect(result?.code).toContain('src="/project/src/views/image.png"');
});

it("keeps script-closing text inside the serialized data script", () => {
  const html = encode({ value: "</script><script>alert(1)</script>" }, { id: "payload" });

  expect(html).not.toContain("</script><script>alert");
  expect(html).toContain("\\u003C/script>");
  expect(parse(html.match(/>(.*)<\/script>/s)![1])).toEqual({
    value: "</script><script>alert(1)</script>",
  });
});

it("resolves promise-like integrations", async () => {
  const integration = {
    then(resolve: (value: { name: string }) => void) {
      resolve({ name: "thenable" });
    },
  };

  await expect(resolve(integration)).resolves.toEqual({ name: "thenable" });
});
