import express from "express";
import { makeLocals } from "stack54/locals";
import view from "@stack54/express/render";
import { render } from "./utils/view.js";

import Locals from "./views/locals.svelte";

const app = express();

app.use(view(render));

app.get("/locals", (_, res) => {
  res.locals.user = "John";
  return res.render("locals", {});
});

app.get("/without-locals", (_, res) => {
  res.locals.user = "John";
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

// ENV
app.get("/env/client", (_, res) => res.render("env/client"));
app.get("/env/public", (_, res) => res.render("env/public"));
app.get("/env/in-view", (_, res) => res.render("env/in-view"));
app.get("/env/server", (_, res) => {
  return res.render("env/server", { env: import.meta.env.ENV });
});
app.get("/env/view-private-and-public", (_, res) => {
  return res.render("env/hydrate/index");
});

app.get("/island/no-slot", (_, res) => res.render("island/no-slot.page"));
app.get("/island/with-slot", (_, res) => res.render("island/with-slot.page"));
app.get("/island/head", (_, res) => res.render("island/head/index.page"));

app.use((_, res, next) => {
  res.locals.user = "John";
  next();
});

app.get("/render-factory-function", (_, res) => {
  const context = makeLocals(res.locals);
  res.setHeader("Content-Type", "text/html");
  res.send(render("locals", {}, { context }));
});

app.get("/direct-import", (_, res) => {
  const context = makeLocals(res.locals);
  res.setHeader("Content-Type", "text/html");
  res.send(render(Locals, {}, { context }));
});

app.get("/components/client-only", (_, res) => res.render("client-only.page"));

export default app;
