import color from "kleur";
import sade from "sade";
import { ILogObj, Logger as TSLogger } from "tslog";
import figlet from "figlet";
import { run } from "effection";

import { InvalidConfig } from "./config/index.js";

import { format_config_error } from "./message.js";
import { VERSION } from "../../version.js";
import { Logger } from "./logger.js";

const config_option = "Config path, default path if not specified";

const program = sade("stack54").version(VERSION);

const cwd = process.cwd();

const logger = new TSLogger<ILogObj>({
  hideLogPositionForProduction: true,
  type: "pretty",
});

function handle_error(error: unknown) {
  if (error instanceof InvalidConfig) {
    logger.error(format_config_error(error.cause));
  } else if ((error as any).name == "ParseError") {
    const { frame, start, filename } = error as any;
    logger.error(`[ParseError] ${filename}:${start.line}:${start.column}`);
    console.log(color.red(frame));
  } else {
    logger.error(error);
  }

  console.log();

  process.exit(1);
}

program
  .command("dev")
  .option("config", config_option)
  .option("-p, --port", "Port to run the server on")
  .action(async (args) => {
    const { dev } = await import("./dev/index.js");

    const task = run(function* () {
      try {
        yield* Logger.set(logger);
        yield* dev({ cwd, config_file: args.config, port: args.port });
      } catch (error) {
        handle_error(error);
      }
    });

    const close = () => task.halt();

    const shutdown = async () => {
      await close();
      process.exit(0);
    };

    process.on("unhandledRejection", async (error) => {
      handle_error(error);
      process.exit(1);
    });

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  });

program
  .command("build")
  .option("config", config_option)
  .action(async (args) => {
    const { build } = await import("./build/index.js");

    const task = run(function* () {
      try {
        yield* Logger.set(logger);
        yield* build({ cwd, config_file: args.config });
      } catch (error) {
        handle_error(error);
      }
    });

    const shutdown = async () => {
      await task.halt();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  });

figlet("stack54", function (_, data) {
  console.log(data);
  program.parse(process.argv);
});
