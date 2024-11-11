import * as path from "node:path";

import MagicString from "magic-string";
import * as html from "node-html-parser";

import * as compiler from "svelte/compiler";
import type { BaseNode, Element } from "svelte/types/compiler/interfaces";

export type PreparedFacade = {
  code: string;
  extension: string;

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

export async function prepare(
  code: string,
  filename: string
): Promise<PreparedFacade> {
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

  // tags that we need to remove temporarily because they break the build
  const replacements: Array<[string, string]> = [];

  const ast = compiler.parse(code, { filename });

  const s = new MagicString(code);

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

  return {
    moves,
    replacements,
    code: s.toString(),
    extension: path.extname(filename),
  };
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
