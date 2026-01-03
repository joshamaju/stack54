import bodyParser from "body-parser";
import express from "express";
import session from "express-session";
import { engine, View } from "@stack54/express/view";

import type { Task } from "./views/types/task";

import { resolver } from "./utils/view";

declare module "express-session" {
  interface SessionData {
    todos: Task[];
  }
}

const app = express();

app.engine("svelte", engine);
app.set("view engine", "svelte");
app.set("view", View({ resolve: resolver }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: import.meta.env.SESSION_SECRET,
    cookie: { secure: import.meta.env.PROD },
  })
);

app.post("/tasks", (req, res) => {
  req.session.todos = req.body;
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  return res.render("home", { tasks: req.session.todos });
});

export default app;
