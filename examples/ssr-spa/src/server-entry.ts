import express from "express";
import { ServerApp } from "svelte-pilot";
import { engine, View } from "@stack54/express/view";

import { resolver } from "./utils/view";

import router from "./router";

const app = express();

app.engine("svelte", engine);
app.set("view engine", "svelte");
app.set("view", View({ resolve: resolver }));

app.all("*", async (req, res) => {
  const route = await router.handleServer(req.url);

  if (!route) {
    res
      .status(404)
      .send(
        import.meta.env.DEV
          ? `${req.url} did not match any routes. Did you forget to add a catch-all route?`
          : "404 Not Found"
      );
    return;
  }

  const body = ServerApp.render({ router, route });

  return res.render("app", { ...body, state: route.ssrState });
});

export default app;
