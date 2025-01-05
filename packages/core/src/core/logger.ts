import color from "kleur";

import type { Rollup, Logger as ViteLogger } from "vite";

export const dateTimeFormat = new Intl.DateTimeFormat([], {
  hour12: false,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export const LogLevel = {
  Info: {
    label: "Info",
    value: "info",
  },
  Error: {
    label: "Error",
    value: "error",
  },
  Debug: {
    label: "Debug",
    value: "debug",
  },
  Fatal: {
    label: "Fatal",
    value: "fatal",
  },
  Warning: {
    label: "Warning",
    value: "warning",
  },
};

type Level = (typeof LogLevel)[keyof typeof LogLevel];

type Logger = (args: {
  date: Date;
  label?: string;
  logLevel: Level;
  message: string | string[];
}) => void;

const colors = {
  [LogLevel.Info.label]: color.cyan("info"),
  [LogLevel.Error.label]: color.red("error"),
  [LogLevel.Debug.label]: color.yellow("debug"),
  [LogLevel.Fatal.label]: color.yellow("fatal"),
  [LogLevel.Warning.label]: color.yellow("warn"),
};

export const logger: Logger = ({ date, label, message, logLevel }) => {
  const timestamp = `${dateTimeFormat.format(date)}`;
  const prefix = [color.dim(timestamp), colors[logLevel.label]];

  if (label && label.trim() !== "") {
    prefix.push(color.grey(`[${label}]`));
  }

  console.log(
    prefix.join(" "),
    ...(Array.isArray(message) ? message : [message])
  );
};

export function use_logger(
  label?: string
): Pick<Console, "error" | "warn" | "info"> {
  const log = (logLevel: Level, message: string | string[]) => {
    logger({ label, date: new Date(), message, logLevel });
  };

  return {
    info(...message) {
      log(LogLevel.Info, message);
    },
    warn(...message) {
      log(LogLevel.Warning, message);
    },
    error(message) {
      log(LogLevel.Error, message);
    },
  };
}

export function make_vite_logger(scope: "client" | "server") {
  const run = (logLevel: Level, message: string | string[]) => {
    logger({ date: new Date(), message, logLevel, label: scope });
  };

  const warnedMessages = new Set<string>();
  const loggedErrors = new WeakSet<Error | Rollup.RollupError>();

  const logger_: ViteLogger = {
    hasWarned: false,
    info(message) {
      run(LogLevel.Info, message);
    },
    warn(message) {
      logger_.hasWarned = true;
      run(LogLevel.Warning, message);
    },
    warnOnce(message) {
      if (warnedMessages.has(message)) return;
      logger_.hasWarned = true;
      run(LogLevel.Warning, message);
      warnedMessages.add(message);
    },
    error(message, opts) {
      logger_.hasWarned = true;
      run(LogLevel.Error, message);
    },
    // Don't allow clear screen
    clearScreen: () => {},
    hasErrorLogged(error) {
      return loggedErrors.has(error);
    },
  };

  return logger_;
}
