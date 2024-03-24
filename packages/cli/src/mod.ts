import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sade from "sade";
import { create_app } from "./commands/create-app.js";
import { create_controller, create_views } from "./commands/generate/mod.js";

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

program
  .command("make <type> <name>")
  .option("-v, --views", "Views directory to use")
  .option("-c, --controllers", "Controllers directory to use")
  .option("-p, --param", "Route param to use instead of the default :id")
  .action((type, name, opts) => {
    const cwd = process.cwd();

    switch (type) {
      case "controller": {
        const dir = opts.controllers ? path.join(cwd, opts.controllers) : cwd;
        create_controller({ name, directory: dir });
        break;
      }

      case "view": {
        const dir = opts.views ? path.join(cwd, opts.views) : cwd;
        create_views({ name, directory: dir });
        break;
      }

      default:
        break;
    }
  });

program.parse(process.argv);
