import { engine, View } from "@stack54/express/view";
import express from "express";

import { resolver } from "./utils/view";

const app = express();

app.engine("svelte", engine);
app.set("view engine", "svelte");
app.set("view", View({ resolve: resolver }));

app.get("/", (_, res) => {
  return res.render("home");
});

export default app;
