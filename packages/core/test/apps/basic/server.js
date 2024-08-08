// @ts-check

import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

import router from "./dist/server/index.js";

router.use("/*", serveStatic({ root: "./dist/assets" }));

serve(router, (info) => {
  console.log(`Server running ${info.address}:${info.port}`);
});
