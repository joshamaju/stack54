import { Hono } from "hono";
import { view } from "stack54/view";

import { render } from "./utils/view";

const app = new Hono();

app.use(view(render));

app.get("/", (ctx) => ctx.render("welcome"));

export default app;
