import { ZodError } from "zod";
import color from "kleur";

export function formatConfigErrorMessage(err: ZodError) {
  const errors = err.issues.map((issue) => {
    return `  - ${color.bold(issue.path.join("."))}  ${color.red(
      issue.message + "."
    )}`;
  });

  return `Found issue(s) with your configuration:\n${errors.join("\n")}`;
}
