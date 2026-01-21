import { engine, View } from "@stack54/express/view";
import { Readable } from "node:stream";
import express from "express";

import { resolver } from "./utils/view";

const app = express();

app.engine("svelte", engine);
app.set("view engine", "svelte");
app.set("view", View({ resolve: resolver }));

app.get("/stream/await", (_, res) => {
  return res.render("stream-await", { $stream: true }, (_, _stream) => {
    // const stream = html as any as AsyncGenerator<string>;
    // let controller: ReadableStreamDefaultController<string> | undefined;

    // const _stream = new ReadableStream({
    //   start(_controller) {
    //     controller = _controller;
    //   },
    // });

    // (async () => {
    //   for await (const chunk of stream) {
    //     console.log(chunk);
    //     controller?.enqueue(chunk);
    //   }
    //   console.log("done");
    //   controller?.close();
    // })();

    const content = Readable.fromWeb(_stream as any);
    content.pipe(res);
  });
});

app.get("/stream/direct", (_, res) => {
  return res.render("stream-direct", { $stream: true }, (_, _stream) => {
    const content = Readable.fromWeb(_stream as any);
    content.pipe(res);
  });
});

app.get("/", (_, res) => {
  return res.render("home");
});

export default app;
