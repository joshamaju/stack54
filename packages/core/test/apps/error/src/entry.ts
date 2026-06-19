import view from "@stack54/express/render";
import express from "express";
import { render } from "./utils/view.js";

const app = express();

app.use(view(render));

app.get("/components/client-only", (_, res) => {
  res.render("index");
});

export default app;
