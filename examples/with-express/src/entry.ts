import express from "express";
import { register } from "@stack54/express/render";

import { render } from "./utils/view";

const app = express();

register(app, render);

app.get("/", (_, res) => {
  return res.render("welcome", {});
});

export default app;
