import * as path from "node:path";

import { pipe } from "effect/Function";
import * as RA from "effect/ReadonlyArray";

import type { PreprocessorGroup } from "svelte/compiler";
import * as compiler from "svelte/compiler";
import type { BaseNode, Element } from "svelte/types/compiler/interfaces";

import MagicString from "magic-string";

import { Rule, Tags, rules } from "./rules.js";
import { ResolvedConfig } from "vite";

const rules_by_tag = pipe(
  rules,
  RA.reduce({} as Record<Tags, Rule[]>, (acc, rule) => {
    acc[rule.tag] = [...(acc[rule.tag] ?? []), rule];
    return acc;
  })
);

function isLocalPath(path: string) {
  return (
    !path.startsWith("http:") &&
    !path.startsWith("https:") &&
    !path.startsWith("//") &&
    path.startsWith(".")
  );
}

function walk(node: BaseNode, visitor: (node: BaseNode) => BaseNode): BaseNode {
  if (node.children) {
    node.children = node.children.map((_) => walk(_, visitor));
  }

  return visitor(node);
}

export function attach_full_path(config: ResolvedConfig): PreprocessorGroup {
  return {
    name: "attach-real-path",
    markup(args) {
      const name = args.filename!;

      const ast = compiler.parse(args.content);
      const parsed = path.parse(name);

      const s = new MagicString(args.content, { filename: name });

      if (config.command == "serve") {
        // @ts-expect-error
        compiler.walk(ast.html, {
          enter(node) {
            // @ts-expect-error
            walk(node, (node) => {
              if (node.type == "Element") {
                const node_: Element = node as any;

                const name = node_.name as Tags;
                const rules = rules_by_tag[name];

                if (rules) {
                  for (let rule of rules) {
                    if (name === rule.tag) {
                      for (let attr of node_.attributes) {
                        if (
                          attr.type == "Attribute" &&
                          attr.name == rule.attribute
                        ) {
                          const value = attr.value;

                          for (let val of value) {
                            const src = val.raw;

                            if (val && val.type == "Text" && isLocalPath(src)) {
                              const resolved = path.resolve(parsed.dir, src);
                              s.update(val.start, val.end, resolved);
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            });
          },
        });
      }

      return { code: s.toString(), map: s.generateMap() };
    },
  };
}
