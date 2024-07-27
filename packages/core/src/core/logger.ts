import color from "kleur";

import type {
  Rollup,
  Logger as ViteLogger,
  LogLevel as ViteLogLevel,
} from "vite";

import { Effect, HashMap, Logger, LogLevel, Option, Runtime } from "effect";

type LoggerLevel = "debug" | "info" | "warn" | "error";

export const dateTimeFormat = new Intl.DateTimeFormat([], {
  hour12: false,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const chars = {
  info: color.cyan("info"),
  error: color.red("error"),
  warn: color.yellow("warn"),
  debug: color.yellow("debug"),
};

export const log = ({
  level,
  label,
  message,
}: {
  label?: string;
  message: string;
  level: LoggerLevel;
}) => {
  const timestamp = `${dateTimeFormat.format(new Date())}`;
  const prefix = [color.dim(timestamp), chars[level]];
  if (label) prefix.push(color.grey(`[${label}]`));
  console.log(prefix.join(" "), message);
};

export const info = (message: string) => {
  log({ message, level: "info" });
};

export const error = (message: string) => {
  log({ message, level: "error" });
};

export const warn = (message: string) => {
  log({ message, level: "warn" });
};

export function createViteLogger(
  viteLogLevel: ViteLogLevel = "info"
): ViteLogger {
  const warnedMessages = new Set<string>();
  const loggedErrors = new WeakSet<Error | Rollup.RollupError>();

  const logger: ViteLogger = {
    hasWarned: false,
    info(message) {
      log({ label: "vite", message, level: "info" });
    },
    warn(message) {
      logger.hasWarned = true;
      log({ label: "vite", message, level: "warn" });
    },
    warnOnce(message) {
      if (warnedMessages.has(message)) return;
      logger.hasWarned = true;
      log({ label: "vite", message, level: "warn" });
      warnedMessages.add(message);
    },
    error(message, opts) {
      logger.hasWarned = true;

      //   const err = opts?.error;
      //   if (err) loggedErrors.add(err);
      //   // Astro errors are already logged by us, skip logging
      //   if (err && isAstroError(err)) return;
      //   // SSR module and pre-transform errors are always handled by us,
      //   // send to debug logs
      //   if (
      //     message.includes("Error when evaluating SSR module") ||
      //     message.includes("Pre-transform error:")
      //   ) {
      //     astroLogger.debug("vite", message);
      //     return;
      //   }

      log({ label: "vite", message, level: "error" });
    },
    // Don't allow clear screen
    clearScreen: () => {},
    hasErrorLogged(error) {
      return loggedErrors.has(error);
    },
  };

  return logger;
}

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
