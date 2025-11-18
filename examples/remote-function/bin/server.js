// @ts-check

import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

import router from "../dist/server/index.js";

const app = new Hono();

app.use("/assets/*", serveStatic({ root: "./dist" }));
app.use("*", serveStatic({ root: "./static" }));

app.route("/", router);

const port = parseInt(process.env.PORT || "3001");

serve({ port, fetch: app.fetch }, () => {
  console.log(`✅ app ready: http://localhost:${port}`);
});
