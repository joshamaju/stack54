import express from "express";
import bodyParser from "body-parser";
import session from "express-session";

import { register } from "@stack54/express/render";

import { render } from "./utils/view";
import type { Task } from "./views/types/task";

declare module "express-session" {
  interface SessionData {
    todos: Task[];
  }
}

const app = express();

register(app, render);

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
