import express from "express";
import { toNodeHandler } from "stack54/node";
import router from "./entry.js";

const app = express();

const serve_build = express.static("public/assets", {
  immutable: true,
  maxAge: "1y",
});

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable("x-powered-by");

app.use("/assets", serve_build);

app.use(express.static("public", { maxAge: "1h" }));

app.all("*", toNodeHandler(router));

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`✅ app ready: http://localhost:${port}`);
});
