/**
 * https://github.com/expressjs/express/blob/4.13.1/lib/view.js
 * Modify the view constructor in express so that users can still use other view engines alongside ours
 */

import fs from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, extname, join, resolve } from "node:path";

import type { Template } from "stack54";

function tryStat(path: fs.PathLike) {
  try {
    return fs.statSync(path);
  } catch (e) {
    return undefined;
  }
}

interface Options {
  root: string;
  defaultEngine?: string;
  engines: Record<string, Function>;
}

interface Context extends Options {
  // members
  ext?: string;
  name: string;
  engine: Function;
  path: string | Template | Promise<Template>;

  // methods
  lookup(name: string): Context["path"];
  resolve(dir: string, file: string): string | undefined;
}

const require = createRequire(import.meta.url);

export default function make({
  resolve: resolver,
}: {
  resolve(path: string): Template | Promise<Template>;
}) {
  /**
   * Initialize a new `View` with the given `name`.
   *
   * Options:
   *
   *   - `defaultEngine` the default template engine name
   *   - `engines` template engine require() cache
   *   - `root` root path for view lookup
   */

  function View(this: Context, name: string, options: Options) {
    const opts = options || {};

    this.name = name;
    this.root = opts.root;
    this.ext = extname(name);
    this.defaultEngine = opts.defaultEngine;

    if (!this.ext && !this.defaultEngine) {
      throw new Error(
        "No default engine was specified and no extension was provided."
      );
    }

    let fileName = name;

    if (!this.ext) {
      // get extension from default engine name
      this.ext =
        this.defaultEngine?.[0] !== "."
          ? "." + this.defaultEngine
          : this.defaultEngine;

      fileName += this.ext;
    }

    if (!opts.engines[this.ext]) {
      // load engine
      opts.engines[this.ext] = require(this.ext.substr(1)).__express;
    }

    // store loaded engine
    this.engine = opts.engines[this.ext];

    // lookup path
    this.path = this.lookup(name);
    this.path ??= this.lookup(fileName);
  }

  /**
   * Resolve template or perform normal lookup view by the given `name`
   */

  View.prototype.lookup = function lookup(this: Context, name: string) {
    let path;
    const roots = [this.root];

    try {
      const template = resolver(name);
      if (template != undefined && template != null) return template;
    } catch (error) {}

    for (let i = 0; i < roots.length && !path; i++) {
      const root = roots[i];

      // resolve the path
      const loc = resolve(root, name);
      const dir = dirname(loc);
      const file = basename(loc);

      // resolve the file
      path = this.resolve(dir, file);
    }

    return path;
  };

  /**
   * Render with the given options.
   */

  View.prototype.render = function render(
    this: Context,
    options: object,
    callback: Function
  ) {
    this.engine(this.path, options, callback);
  };

  /**
   * Resolve the file within the given directory.
   */

  View.prototype.resolve = function resolve(dir: string, file: string) {
    let ext = this.ext;

    // <path>.<ext>
    let path = join(dir, file);
    let stat = tryStat(path);

    if (stat && stat.isFile()) {
      return path;
    }

    // <path>/index.<ext>
    path = join(dir, basename(file, ext), "index" + ext);
    stat = tryStat(path);

    if (stat && stat.isFile()) {
      return path;
    }
  };

  return View;
}
