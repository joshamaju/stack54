import { Hono } from "hono";
import { handleRequest } from "thaler/server";

import { getTasks } from "./core/tasks";
import { saveTodo } from "./core/todo";
import { renderer } from "./utils/render";

const app = new Hono();

app.use(renderer());

app.use(async (ctx, next) => {
  const response = await handleRequest(ctx.req.raw);
  if (response) return response;
  await next();
});

app.post("/tasks", async (ctx) => {
  const tasks = await ctx.req.json();
  saveTodo(tasks);
  return ctx.json({});
});

app.get("/", (ctx) => {
  return ctx.render("home", { tasks: getTasks() });
});

export default app;
