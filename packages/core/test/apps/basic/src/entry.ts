import { register } from "@stack54/express/render";
import express from "express";
import { render } from "./utils/view.js";

const app = express();

register(app, render);

app.get("/locals", (_, res) => {
  res.locals.user = "John";
  return res.render("locals", {});
});

app.get("/without-locals", (_, res) => {
  res.locals.user = "John";
  // @ts-expect-error
  return res.send(render("locals", {}));
});

app.get("/leaf", (_, res) => res.render("leaf/page"));

app.get("/client-assets", (_, res) => res.render("client-assets/page"));
app.get("/script/inline", (_, res) => res.render("script-inline"));

app.get("/css/inline", (_, res) => res.render("css/inline"));
app.get("/css/nested", (_, res) => res.render("css/nested/index"));

app.get("/head/missing", (_, res) => res.render("head/no-head"));
app.get("/head/svelte", (_, res) => res.render("head/has-head"));
app.get("/head/slotted", (_, res) => res.render("head/slotted-head"));

app.get("/env/client", (_, res) => res.render("env/client"));
app.get("/env/public", (_, res) => res.render("env/public"));
app.get("/env/in-view", (_, res) => res.render("env/in-view"));
app.get("/env/server", (_, res) => {
  return res.render("env/server", { env: import.meta.env.ENV });
});

app.get("/island/no-slot", (_, res) => res.render("island/no-slot.page"));
app.get("/island/with-slot", (_, res) => res.render("island/with-slot.page"));

export default app;
