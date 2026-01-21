import { Hono } from "hono";
import { renderer } from "./utils/render.js";

const app = new Hono();

app.use(renderer());

app.get("/no-script", (ctx) => {
  return ctx.render("stream-await-no-script");
});

app.get("/await/fast", (ctx) => {
  return ctx.render("stream-await-fast");
});

app.get("/await/catch", (ctx) => {
  return ctx.render("stream-await-error");
});

app.get("/await/then", (ctx) => {
  return ctx.render("stream-await-then");
});

app.get("/await", (ctx) => {
  return ctx.render("stream-await");
});

app.get("/direct", (ctx) => {
  return ctx.render("stream-direct");
});

export default app;
