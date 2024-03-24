import fs from "node:fs";
import { fileURLToPath } from "node:url";

import sade from "sade";
import { create_app } from "./commands/create-app.js";

const pkg_file = fs.readFileSync(
  fileURLToPath(new URL("../package.json", import.meta.url)),
  "utf-8"
);

const pkg = JSON.parse(pkg_file);

const program = sade("stack54").version(pkg.version);

program
  .command("new <name>")
  .describe("Bootstrap a new project")
  .option("-t, --template", "Use template", "basic")
  .action((name, opts) => create_app({ name, template: opts.template }));

program.parse(process.argv);
