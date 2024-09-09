import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import methodOverride from "method-override";

import { register } from "@stack54/express/render";

import { render } from "./utils/view";

const app = express();

register(app, render);

app.use(methodOverride());

app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: import.meta.env.SESSION_SECRET,
    cookie: { secure: import.meta.env.PROD },
  })
);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.get("/", (_, res) => {
  return res.render("welcome", {});
});

export default app;
