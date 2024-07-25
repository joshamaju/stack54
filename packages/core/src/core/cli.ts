import sade from "sade";
import color from "kleur";

import * as fs from "node:fs";
import { fileURLToPath } from "node:url";

import * as Log from "./logger.js";

const pkg_path = fileURLToPath(new URL("../../package.json", import.meta.url));

const pkg = JSON.parse(fs.readFileSync(pkg_path, "utf-8"));

const program = sade("stack54-cli").version(pkg.version);

program.command("dev").action(async () => {
  const { dev } = await import("./dev/index.js");
  const handle = await dev();

  process.on("SIGINT", async () => {
    console.log(`\n${color.dim("---")}`);
    Log.info("shutting down server...");
    await handle.shutdown();
    Log.info("server closed");
  });

  process.on("unhandledRejection", (error) => {
    // console.log(error);
    // Log.error(error.stack ?? error.message);
    process.exit(1);
  });
});

program.command("build").action(async () => {
  (await import("./build/index.js")).build();
});

program.parse(process.argv);
