import { Hono } from "hono";

import { renderer } from "./utils/render";

const app = new Hono();

app.use(renderer());

app.get("/", (ctx) => {
  return ctx.render("welcome");
});

export default app;
