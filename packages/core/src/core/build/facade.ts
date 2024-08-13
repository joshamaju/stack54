import * as path from "node:path";

import MagicString from "magic-string";
import * as html from "node-html-parser";

import * as compiler from "svelte/compiler";
import type { BaseNode, Element } from "svelte/types/compiler/interfaces";

import type { ResolvedConfig } from "../config/index.js";

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

export async function prepare_async(
  code: string,
  filename: string,
  config: ResolvedConfig["svelte"]
) {
  function walk(
    node: BaseNode,
    visitor: (node: BaseNode) => BaseNode
  ): BaseNode {
    if (node.children) {
      node.children = node.children.map((_) => walk(_, visitor));
    }

    return visitor(node);
  }

  // tags that we'll need to move back to their original location
  const moves: Array<string> = [];

  // tags that we need to remove temporarily
  const replacements: Array<[string, string]> = [];

  const processed = await compiler.preprocess(code, config.preprocess ?? [], {
    filename,
  });

  const ast = compiler.parse(processed.code);

  const s = new MagicString(processed.code);

  const wrap = [ast.module, ast.instance, ast.css].filter(
    (_) => _ !== undefined
  );

  // @ts-ignore
  wrap.forEach(({ end, start }) => {
    const placeholder = make_marker();
    replacements.push([placeholder, s.slice(start, end)]);
    s.update(start, end, placeholder);
  });

  // @ts-expect-error
  compiler.walk(ast.html, {
    enter(node) {
      // @ts-expect-error
      walk(node, (node) => {
        if (node.type == "Element") {
          const node_: Element = node as any;
          const name = node_.name;

          if (name == "link" || name == "script") {
            const { end, start } = node_;

            const id = make_id();
            const content = s.slice(start, end);
            const wrapped = `<html data-move="${id}"><head>${content}</head></html>`;

            moves.push(id);
            s.update(start, end, wrapped);
          }
        }
      });
    },
  });

  return { moves, replacements, code: s.toString() };
}

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

  const node = html.parse(code);

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
