import { engine, View } from "@stack54/express/view";
import express from "express";

import { resolve } from "./utils/view";

const app = express();

app.engine("svelte", engine);
app.set("view engine", "svelte");
app.set("view", View({ resolve }));

app.get("/", (_, res) => res.render("welcome", {}));

export default app;
