import { createContext } from "effection";
import { ILogObj, Logger as TSLogger } from "tslog";

import type { Rollup, Logger as ViteLogger } from "vite";

export const Logger = createContext<TSLogger<ILogObj>>("Logger");

export function* use_logger(label?: string) {
  const logger = yield* Logger.expect();
  return label ? logger.getSubLogger({ name: label }) : logger;
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
      logger.error(opts?.error, message);
    },
    // Don't allow clear screen
    clearScreen: () => {},
    hasErrorLogged(error) {
      return loggedErrors.has(error);
    },
  };

  return logger_;
}
