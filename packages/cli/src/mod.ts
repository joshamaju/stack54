import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sade from "sade";
import color from "kleur";

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

enum Type {
  mvc = "mvc",
  view = "view",
  controller = "controller",
}

program
  .command("make <type> <name>")
  .option("-t, --views", "Views directory to use")
  .option("-c, --controllers", "Controllers directory to use")
  .option("-p, --param", "Route param to use instead of the default :id")
  .action(async (type, name, opts) => {
    const cwd = process.cwd();

    switch (type) {
      case Type.controller: {
        const dir = opts.controllers ? path.join(cwd, opts.controllers) : cwd;
        create_controller({ name, directory: dir, param: opts.param });
        break;
      }

      case Type.view: {
        const dir = opts.views ? path.join(cwd, opts.views) : cwd;
        create_views({ name, directory: dir });
        break;
      }

      case Type.mvc: {
        if (!opts.views) {
          console.log(color.red("Please specify your views directory"));
          process.exit(1);
        }

        if (!opts.controllers) {
          console.log(color.red("Please specify your controllers directory"));
          process.exit(1);
        }

        const view_dir = path.join(cwd, opts.views);
        const controllers_dir = path.join(cwd, opts.controllers);

        create_controller({
          name,
          param: opts.param,
          directory: controllers_dir,
        });

        console.log();

        create_views({ name, directory: view_dir });
        break;
      }

      default:
        break;
    }
  });

program.parse(process.argv);
