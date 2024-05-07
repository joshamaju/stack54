import express from "express";
import { toNodeHandler } from "stack54/node";

const MODE = process.env.NODE_ENV ?? "development";
const IS_PROD = MODE === "production";

const vite_dev_server = IS_PROD
  ? undefined
  : await import("vite").then((vite) =>
      vite.createServer({ server: { middlewareMode: true } })
    );

const build = await (vite_dev_server
  ? vite_dev_server.ssrLoadModule("./src/entry.ts")
  : import("./dist/index.js"));

const app = express();

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable("x-powered-by");

if (vite_dev_server) {
  app.use(vite_dev_server.middlewares);
} else {
  const serve_build = express.static("public/assets", {
    immutable: true,
    maxAge: "1y",
  });

  app.use("/assets", serve_build);
  app.use(express.static("public", { maxAge: "1h" }));
}

app.all("*", toNodeHandler(build.default));

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`✅ app ready: http://localhost:${port}`);
});
