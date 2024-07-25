import * as path from "node:path";
import { parse } from "node-html-parser";

export type PreparedFacade = {
  code: string;

  // tags that we'll need to move back to their original location
  moves: Array<string>;

  // tags that we need to remove temporarily
  replacements: Array<[string, string]>;
};

export function make(view: string, out_dir: string) {
  const { dir, name } = path.parse(view);
  return path.join(out_dir, dir, `${name}.html`);
}

const make_id = () => `${Math.random()}${Math.random()}`;

const make_marker = () => `<build-marker>${make_id()}</build-marker>`;

export function prepare(code: string): PreparedFacade {
  const link_regex = /<link(\s[^]*?)?(?:>([^]*?)<\/link>|\/>)/gim;
  const script_regex = /<script(\s[^]*?)?(?:>([^]*?)<\/script>|\/>)/gim;
  const style_regex = /<style(\s[^]*?)?(?:>([^]*?)<\/style>|\/>)/gim;
  const module_regex = /type\s*=\s*["']module["']/i;

  // tags that we'll need to move back to their original location
  const moves: Array<string> = [];

  // tags that we need to remove temporarily
  const replacements: Array<[string, string]> = [];

  /**
   * we assume none module script tags are svelte component instance scripts - which should be only one
   * But this might pick up normal non-module inline script tags, but we're not worried about those given
   * there's no need to process them here
   */
  code = code.replace(script_regex, (match, attrs) => {
    const is_module = module_regex.test(attrs);

    if (is_module) {
      /**
       * vite moves script module tags from the body to the head, but it moves them
       * to the top if the document has no head. Which will be the case if you have
       * a component with a script tag i.e
       *
       * ```html
       * <svelte:head>
       *  <script type="module" src="./app.ts"></l>
       * </svelte:head>
       *
       * which breaks the svelte build because you can only have one top-level script.
       * so we need to wrap them in html with head tag to make vite keep them in place,
       * which we then clean up at the end of the build.
       * ```
       */
      const id = make_id();
      moves.push(id);
      return `<html data-move="${id}"><head>${match}</head></html>`;
    }

    const p = make_marker();
    replacements.push([p, match]);
    return p;
  });

  code = code.replace(link_regex, (match) => {
    const id = make_id();
    moves.push(id);
    return `<html data-move="${id}"><head>${match}</head></html>`;
  });

  const template = code.replace(style_regex, (match) => {
    const p = make_marker();
    replacements.push([p, match]);
    return p;
  });

  return { moves, replacements, code: template };
}

export function reconstruct({ code, moves, replacements }: PreparedFacade) {
  if (replacements.length) {
    replacements.forEach(([p, s]) => {
      code = code.replace(p, s);
    });
  }

  const node = parse(code);

  moves.forEach((id) => {
    const doc = node.querySelector(`[data-move="${id}"]`);
    const nodes = doc?.querySelectorAll("head > *");

    const regex = new RegExp(
      `<html\\s+data-move="${id}">(?:.|[\r\n])*?<\/html>`,
      "i"
    );

    if (doc) {
      const assets = nodes?.map((_) => _.toString()).join("") ?? "";
      code = code.replace(regex, assets);
    }
  });

  return code;
}
