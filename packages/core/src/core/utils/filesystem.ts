import { glob, GlobOptionsWithFileTypesUnset } from "glob";

export function posixify(str: string) {
  return str.replace(/\\/g, "/");
}

export function to_fs(str: string) {
  str = posixify(str);
  return `/@fs${
    // Windows/Linux separation - Windows starts with a drive letter, we need a / in front there
    str.startsWith("/") ? "" : "/"
  }${str}`;
}

export const expand = (
  pattern: string | string[],
  options?: GlobOptionsWithFileTypesUnset
) => glob(pattern, options);
