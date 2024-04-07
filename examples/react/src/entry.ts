import { Hono } from "hono";
import { view } from "stack54/view";

import { render } from "./utils/view";

const app = new Hono();

app.use(view(render));

app.get("/", async (ctx) => {
  return ctx.render("welcome", {});
});

export default app;
