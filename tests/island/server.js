// @ts-check

import express from "express";

import router from "./dist/server/index.js";

const port = 3001;

const app = express();

app.use(express.static("./dist"));
app.use(router);

app.listen(port, function () {
  console.log(`Server listening on port ${port}!`);
});
