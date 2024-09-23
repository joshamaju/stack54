import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import compression from "compression";
import methodOverride from "method-override";

import { register } from "@stack54/express/render";

import { render } from "./utils/view";
import { errorHandler } from "./error";

const app = express();

register(app, render);

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

app.use(errorHandler);

export default app;
