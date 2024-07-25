import colors from "kleur";

import type { LogLevel, Rollup, Logger as ViteLogger } from "vite";

type LoggerLevel = "debug" | "info" | "warn" | "error";

export const dateTimeFormat = new Intl.DateTimeFormat([], {
  hour12: false,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const chars = {
  info: colors.cyan("info"),
  error: colors.red("error"),
  warn: colors.yellow("warn"),
  debug: colors.yellow("debug"),
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
  const prefix = [colors.dim(timestamp), chars[level]];
  if (label) prefix.push(colors.grey(`[${label}]`));
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

export function createViteLogger(viteLogLevel: LogLevel = "info"): ViteLogger {
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
