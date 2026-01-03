// @ts-check

import express, { static as static_ } from "express";
import router from "../dist/server/entry.js";

const app = express();

const serve_build_assets = static_("./dist", {
  immutable: true,
  maxAge: "1y",
});

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable("x-powered-by");

app.use(serve_build_assets);

app.use(static_("static", { maxAge: "1h" }));

app.use(router);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`✅ app ready: http://localhost:${port}`);
});
