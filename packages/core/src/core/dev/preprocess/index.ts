import * as path from "node:path";
import * as url from "node:url";

import type { PreprocessorGroup } from "svelte/compiler";
import * as compiler from "svelte/compiler";
import type { BaseNode, Element, Text } from "svelte/types/compiler/interfaces";

import * as lexer from "es-module-lexer";
import MagicString from "magic-string";

import { Rule, Tags, rules } from "./rules.js";

function isLocalPath(path: string) {
  return (
    !path.startsWith("http:") &&
    !path.startsWith("https:") &&
    !path.startsWith("//") &&
    (path.startsWith(".") || path.startsWith(".."))
  );
}

function walk(node: BaseNode, visitor: (node: BaseNode) => BaseNode): BaseNode {
  if (node.children) {
    node.children = node.children.map((_) => walk(_, visitor));
  }

  return visitor(node);
}

function posixify(str: string) {
  return str.replace(/\\/g, "/");
}

function to_fs(str: string) {
  str = posixify(str);
  return `/@fs${
    // Windows/Linux separation - Windows starts with a drive letter, we need a / in front there
    str.startsWith("/") ? "" : "/"
  }${str}`;
}

export const RESOLVER_PREFIX = "/@resolve:";

const rules_by_tag = rules.reduce((acc, rule) => {
  acc[rule.tag] = [...(acc[rule.tag] ?? []), rule];
  return acc;
}, {} as Record<Tags, Rule[]>);

export function attachFullPath({
  assetPrefix = "/",
}: {
  assetPrefix?: string;
}): PreprocessorGroup {
  return {
    name: "attach-actual-path",
    async markup(args) {
      const name = args.filename!;

      const ast = compiler.parse(args.content);
      const parsed = path.parse(name);

      const s = new MagicString(args.content, { filename: name });

      await lexer.init;

      // @ts-expect-error
      compiler.walk(ast.html, {
        enter(node) {
          // @ts-expect-error
          walk(node, (node) => {
            // console.log(inspect(node, false, Infinity));

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
                            const file = path.join(assetPrefix, resolved);
                            s.update(val.start, val.end, file);
                          }
                        }
                      }
                    }
                  }
                }
              }

              if (name == "script") {
                const content = node_.children?.find((_) => _.type == "Text");

                if (content && args.filename) {
                  const code = (content as Text).data;

                  if (code.trim() !== "") {
                    const filename = args.filename;
                    const [imports] = lexer.parse(code);

                    const ss = new MagicString(code).trimLines();

                    imports.forEach((imported) => {
                      const slice = ss.slice(imported.s, imported.e);
                      const { query, pathname } = url.parse(slice);

                      const q = new url.URLSearchParams(query || undefined);

                      q.set("file", filename);

                      let resolved = "";

                      if (isLocalPath(slice)) {
                        const file = path.resolve(parsed.dir, pathname!);
                        resolved = path.join(assetPrefix, to_fs(file));
                      } else {
                        resolved = `${RESOLVER_PREFIX}${pathname}?${q.toString()}`;
                      }

                      ss.update(imported.s, imported.e, resolved);
                    });

                    s.update(content.start, content.end, ss.toString());
                  }
                }
              }
            }

            return node;
          });
        },
      });

      return { code: s.toString(), map: s.generateMap() };
    },
  };
}
