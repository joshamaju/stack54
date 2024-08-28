import color from "kleur";

import type { Rollup, Logger as ViteLogger } from "vite";

import { Effect, HashMap, Logger, LogLevel, Option, Runtime } from "effect";

export const dateTimeFormat = new Intl.DateTimeFormat([], {
  hour12: false,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function makeViteLogger(): Effect.Effect<ViteLogger> {
  return Effect.gen(function* () {
    const runtime = yield* Effect.runtime();
    const run_sync = Runtime.runSync(runtime);

    const run = (effect: Effect.Effect<any>) => {
      run_sync(Effect.annotateLogs(effect, "label", "vite"));
    };

    const warnedMessages = new Set<string>();
    const loggedErrors = new WeakSet<Error | Rollup.RollupError>();

    const logger: ViteLogger = {
      hasWarned: false,
      info(message) {
        run(Effect.logInfo(message));
      },
      warn(message) {
        logger.hasWarned = true;
        run(Effect.logWarning(message));
      },
      warnOnce(message) {
        if (warnedMessages.has(message)) return;
        logger.hasWarned = true;
        run(Effect.logWarning(message));
        warnedMessages.add(message);
      },
      error(message, opts) {
        logger.hasWarned = true;
        run(Effect.logError(message));
      },
      // Don't allow clear screen
      clearScreen: () => {},
      hasErrorLogged(error) {
        return loggedErrors.has(error);
      },
    };

    return logger;
  });
}

const colors = {
  [LogLevel.Info.label]: color.cyan("info"),
  [LogLevel.Error.label]: color.red("error"),
  [LogLevel.Debug.label]: color.yellow("debug"),
  [LogLevel.Fatal.label]: color.yellow("fatal"),
  [LogLevel.Warning.label]: color.yellow("warn"),
};

export const simpleLogger = Logger.make(
  ({ date, message, logLevel, annotations }) => {
    const label = HashMap.get(annotations, "label");
    const timestamp = `${dateTimeFormat.format(date)}`;
    const prefix = [color.dim(timestamp), colors[logLevel.label]];

    if (Option.isSome(label)) {
      prefix.push(color.grey(`[${label.value}]`));
    }

    console.log(
      prefix.join(" "),
      ...(Array.isArray(message) ? message : [message])
    );
  }
);
