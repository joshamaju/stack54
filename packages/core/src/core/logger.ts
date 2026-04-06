import color from "kleur";
import { ContextLogger, Formatter, LogRecord } from "@jamx/logger";
import { createContext } from "effection";
import type { Rollup, Logger as ViteLogger } from "vite";

export const Logger = createContext<ContextLogger>("Logger");

export function* use_logger(label?: string) {
  const logger = yield* Logger.expect();
  return label ? logger.child({ logger: label }) : logger;
}

export function* make_vite_logger(scope: "client" | "server") {
  const logger = yield* use_logger(scope);

  const warnedMessages = new Set<string>();
  const loggedErrors = new WeakSet<Error | Rollup.RollupError>();

  const logger_: ViteLogger = {
    hasWarned: false,
    info(message) {
      logger.info(message);
    },
    warn(message) {
      logger_.hasWarned = true;
      logger.warn(message);
    },
    warnOnce(message) {
      if (warnedMessages.has(message)) return;
      logger_.hasWarned = true;
      logger.warn(message);
      warnedMessages.add(message);
    },
    error(message, opts) {
      logger_.hasWarned = true;
      logger.error(message, { error: opts?.error });
    },
    // Don't allow clear screen
    clearScreen: () => {},
    hasErrorLogged(error) {
      return loggedErrors.has(error);
    },
  };

  return logger_;
}

export class TextFormatter implements Formatter {
  format(log: LogRecord): string {
    const loggerName =
      typeof log.meta.logger === "string" && log.meta.logger.length > 0
        ? `[${log.meta.logger}]`
        : "";

    const { logger: _logger, ...displayMeta } = log.meta;

    const pieces = [
      color.dim(log.timestamp.toLocaleTimeString()),
      loggerName,
      log.message,
    ].filter(Boolean);

    const metaOutput =
      Object.keys(displayMeta).length > 0
        ? ` ${JSON.stringify(displayMeta)}`
        : "";

    return `${pieces.join(" ")}${metaOutput}`;
  }
}
