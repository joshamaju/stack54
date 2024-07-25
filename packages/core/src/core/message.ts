import { ZodError } from "zod";
import color from "kleur";

export function formatConfigErrorMessage(err: ZodError) {
  const errorList = err.issues.map(
    (issue) =>
      `  ! ${color.bold(issue.path.join("."))}  ${color.red(
        issue.message + "."
      )}`
  );

  return `Found issue(s) with your configuration:\n${errorList.join("\n")}`;
}
