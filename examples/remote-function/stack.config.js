// @ts-check

import island from "@stack54/island";
import thaler from "unplugin-thaler";
import hono from "@hono/vite-dev-server";
import { defineConfig } from "stack54/config";
import { inspect } from "node:util";

export default defineConfig({
  views: ["src/views/**/*.svelte"],
  build: { minify: false },
  integrations: [
    island(),
    // {
    //   name: "rf:config",
    //   config() {
    //     return {
    //       vite: {
    //         plugins: [
    //           thaler.vite({
    //             mode: "server",
    //             filter: {
    //               include: "src/**/*.{svelte,ts}",
    //             },
    //           }),
    //         ],
    //       },
    //     };
    //   },
    // },
    // {
    //   name: "mod",
    //   configResolved(c) {
    //     console.log(inspect(c.vite, false, Infinity));
    //   },
    // },
  ],
  vite: {
    plugins: [
      hono({ entry: "src/entry.ts" }),
      thaler.vite({
        mode: "server",
        filter: {
          include: "src/**/*.{svelte,ts}",
        },
      }),
    ],
  },
});
