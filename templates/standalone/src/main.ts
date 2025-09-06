import "dotenv/config";

import logger from "morgan";
import bodyParser from "body-parser";
import session from "express-session";
import compression from "compression";
import methodOverride from "method-override";
import express, { static as static_ } from "express";

import { engine, View } from "@stack54/express/view";

import { errorHandler } from "./error.js";
import { resolver } from "../build/server/index.js";

const app = express();

app.engine("svelte", engine);
app.set("view engine", "svelte");
app.set("view", View({ resolve: resolver }));

app.use(logger("dev"));
app.use(compression());
app.use(methodOverride());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET!,
    cookie: { secure: process.env.NODE_ENV == "production" },
  }),
);

const serve_build_assets = static_("./build", {
  immutable: true,
  maxAge: "1y",
});

app.use(serve_build_assets);

app.use(static_("./resources/static", { maxAge: "1h" }));

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

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`✅ app ready: http://localhost:${port}`);
});
