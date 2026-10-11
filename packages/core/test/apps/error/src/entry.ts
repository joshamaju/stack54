import view from "@stack54/express/render";
import express from "express";
import { render } from "./utils/view.js";

const app = express();

app.use(view(render));

// Render through a callback so these fixtures can report SSR errors as HTTP 500s.
function renderView(name: string) {
  return (_: express.Request, res: express.Response) => {
    res.render(name, (error, html) => {
      if (error) return res.status(500).send(error.message);
      res.send(html);
    });
  };
}

app.get("/invalid-syntax", renderView("invalid-syntax"));
app.get("/render-error", renderView("render-error"));
app.get("/undefined-variable", renderView("undefined-variable"));

export default app;
