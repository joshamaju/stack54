import { Hono } from "hono";

import { renderer } from "./utils/render";

const app = new Hono();

app.use(renderer());

app.get("/error", () => {
  throw new Error("boom 💥");
});

app.get("/", (ctx) => {
  return ctx.render("welcome");
});

app.notFound((ctx) => {
  return ctx.render("404");
});

app.onError((error, ctx) => {
  console.error(error);
  return ctx.render("error", { error });
});

export default app;
