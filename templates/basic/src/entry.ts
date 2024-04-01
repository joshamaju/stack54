import { Hono } from "hono";
import { VERSION } from "svelte/compiler";
import { view } from "stack54/view";

import { $ } from "execa";

import { render } from "./utils/view";
import { dependencies } from "../package.json";

const app = new Hono();

app.use(view(render));

app.get("/", async (ctx) => {
  const node = await $`node -v`;

  return ctx.render("welcome", {
    versions: {
      node: node.stdout,
      svelte: `v${VERSION}`,
      stack54: dependencies.stack54,
    },
  });
});

export default app;
