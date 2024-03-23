import path from "node:path";

export function posixify(str: string) {
  return str.replace(/\\/g, "/");
}

/**
 * Like `path.join`, but posixified and with a leading `./` if necessary
 */
export function join_relative(...str: string[]) {
  let result = posixify(path.join(...str));
  if (!result.startsWith(".")) {
    result = `./${result}`;
  }
  return result;
}

/**
 * Like `path.relative`, but always posixified and with a leading `./` if necessary.
 * Useful for JS imports so the path can safely reside inside of `node_modules`.
 * Otherwise paths could be falsely interpreted as package paths.
 */
export function relative_path(from: string, to: string) {
  return join_relative(path.relative(from, to));
}
