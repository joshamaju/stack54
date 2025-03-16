import view from "@stack54/express/render";
import express from "express";
import { render } from "./utils/view.js";

const app: express.Express = express();

app.use(view(render));

app.get("/no-slot", (_, res) => res.render("no-slot.page"));
app.get("/with-slot", (_, res) => res.render("with-slot.page"));
app.get("/head", (_, res) => res.render("head/index.page"));

export default app;
