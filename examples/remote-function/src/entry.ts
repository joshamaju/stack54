import { Hono } from "hono";
import { handleRequest } from "thaler/server";
import { getCookie, setCookie } from "hono/cookie";

import { renderer } from "./utils/render";
import { storage } from "./utils/session";
import { saveTodo, tasks } from "./core/todo";

const app = new Hono();

app.use(renderer());

app.use(async (ctx, next) => {
  const response = await storage.run(ctx, () => handleRequest(ctx.req.raw));
  if (response) return response;
  await next();
});

app.post("/tasks", async (ctx) => {
  const tasks = await ctx.req.json();
  // setCookie(ctx, "tasks", JSON.stringify(tasks));
  saveTodo(tasks);
  return ctx.json({});
});

app.get("/", (ctx) => {
  // const cookie = getCookie(ctx, "tasks");
  // const tasks = cookie ? JSON.parse(cookie) : [];
  return ctx.render("home", { tasks });
});

export default app;
