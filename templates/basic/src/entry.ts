import { Hono } from "hono";
import { VERSION } from "svelte/compiler";

import { $ } from "execa";

import { view } from "./utils/view";
import { dependencies } from "../package.json";

const app = new Hono();

app.get("/", async (ctx) => {
  const node = await $`node -v`;

  return ctx.html(
    view("welcome", {
      versions: {
        node: node.stdout,
        svelte: `v${VERSION}`,
        stack54: dependencies.stack54,
      },
    })
  );
});

export default app;
