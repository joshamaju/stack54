import z, { SafeParseReturnType } from "zod";

import { options, UserConfig, Config } from "./options.js";

export class ConfigError {
  readonly _tag = "ConfigError";
  constructor(readonly error: z.ZodError<UserConfig>) {}
}

export function parse(
  config: UserConfig
): SafeParseReturnType<UserConfig, Config> {
  return options.safeParse(config);
}
