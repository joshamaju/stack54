import { Hono } from "hono";
import { renderer } from "./utils/render.js";

const app = new Hono();

app.use(renderer());

app.get("/", (ctx) => {
  return ctx.render("home");
});

export default app;
