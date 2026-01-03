import express from "express";
import { engine, View } from "@stack54/express/view";

import { resolve } from "./utils/view";

const app = express();

app.engine("svelte", engine);
app.set("view engine", "svelte");
app.set("view", View({ resolve }));

app.get("/", async (_, res) => {
  return res.render("welcome", {});
});

export default app;
