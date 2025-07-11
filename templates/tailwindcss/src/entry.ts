import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import compression from "compression";
import methodOverride from "method-override";

import logger from "morgan";

import { engine, View } from "@stack54/express/view";

import { resolver } from "./utils/view";
import { errorHandler } from "./error";

const app = express();

app.engine("svelte", engine);
app.set("view engine", "svelte");
app.set("view", View({ resolve: resolver }));

app.use(logger("dev"));

app.use(compression());

app.use(methodOverride());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: import.meta.env.SESSION_SECRET,
    cookie: { secure: import.meta.env.PROD },
  })
);

app.get("/", (_, res) => {
  return res.render("welcome", {});
});

app.get("/404", (_, __, next) => {
  next();
});

app.get("/500", () => {
  throw new Error("Internal server error");
});

app.use(errorHandler);

app.use(function (_, res) {
  res.status(404).render("404");
});

export default app;
