import { Hono } from "hono";
import { setLocals } from "stack54/locals";
import { view } from "stack54/view";
import { render } from "./utils/view";

const app = new Hono();

app.use("/*", view(render));

app.get("/locals", (ctx) => {
  setLocals(ctx, "user", "John");
  return ctx.render("locals", {});
});

app.get("/without-locals", (ctx) => {
  setLocals(ctx, "user", "John");
  return ctx.html(render("locals", {}));
});

app.get("/leaf", (ctx) => ctx.render("leaf/page"));

app.get("/client-assets", (ctx) => ctx.render("client-assets/page"));
app.get("/script/inline", (ctx) => ctx.render("script-inline"));

app.get("/css/inline", (ctx) => ctx.render("css/inline"));
app.get("/css/nested", (ctx) => ctx.render("css/nested/index"));

app.get("/head/missing", (ctx) => ctx.render("head/no-head"));
app.get("/head/svelte", (ctx) => ctx.render("head/has-head"));
app.get("/head/slotted", (ctx) => ctx.render("head/slotted-head"));

export default app;
