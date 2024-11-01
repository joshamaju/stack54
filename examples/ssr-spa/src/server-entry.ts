import express from "express";
import { register } from "@stack54/express/render";

import { render } from "./utils/view";

import { ServerApp } from "svelte-pilot";
import router from "./router";

const app = express();

register(app, render);

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
