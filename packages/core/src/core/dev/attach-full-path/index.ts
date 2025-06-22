import module from "node:module";
import * as path from "node:path";
import * as url from "node:url";

import type { PreprocessorGroup } from "svelte/compiler";
import * as compiler from "svelte/compiler";
import type { AST } from "svelte/compiler";
import { walk } from "estree-walker";

import * as lexer from "es-module-lexer";
import MagicString from "magic-string";

import { to_fs } from "../../utils/filesystem.js";
import { Rule, Tags, rules } from "./rules.js";
import { visit } from "../../utils/walk.js";

function isLocalPath(path: string) {
  return (
    !path.startsWith("http:") &&
    !path.startsWith("https:") &&
    !path.startsWith("//") &&
    (path.startsWith(".") || path.startsWith(".."))
  );
}

const DYNAMIC_IMPORT = 2;

export const RESOLVER_PREFIX = "/@resolve:";

const rules_by_tag = rules.reduce((acc, rule) => {
  acc[rule.tag] = [...(acc[rule.tag] ?? []), rule];
  return acc;
}, {} as Record<Tags, Rule[]>);

const require = module.createRequire(import.meta.url);

export function attach_full_path({
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

      walk(ast.html, {
        enter(node) {
          visit(node, (node) => {
            if (node.type == "Element") {
              const node_: AST.RegularElement = node as any;

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
                        const value = Array.isArray(attr.value)
                          ? attr.value
                          : [attr.value];

                        for (let val of value) {
                          if (
                            typeof val !== "boolean" &&
                            val.type !== "ExpressionTag"
                          ) {
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
              }

              if (name == "script" && "children" in node_) {
                const content = (node_.children as Array<AST.Text>).find(
                  (_) => _.type == "Text"
                );

                if (content && args.filename) {
                  const code = content.data;

                  if (code.trim() !== "") {
                    const filename = args.filename;
                    const [imports] = lexer.parse(code);

                    const ss = new MagicString(code).trimLines();

                    imports.forEach((imported) => {
                      const slice = imported.n;

                      if (slice) {
                        let resolved = slice;
                        const { query, pathname } = url.parse(slice);

                        if (slice.startsWith("./") || slice.startsWith("../")) {
                          const file = path.resolve(parsed.dir, pathname!);
                          resolved = path.join(assetPrefix, to_fs(file));
                        } else {
                          try {
                            resolved = to_fs(require.resolve(slice));
                          } catch (error) {
                            if (
                              !slice.startsWith("/@fs") &&
                              !slice.startsWith(RESOLVER_PREFIX)
                            ) {
                              /**
                               * most likely an import alias, to be resolved by
                               * the resolve-inline-imports plugin
                               */
                              const init = query || undefined;
                              const q = new url.URLSearchParams(init);
                              q.set("file", filename);
                              resolved = `${RESOLVER_PREFIX}${pathname}?${q.toString()}`;
                            }
                          }
                        }

                        ss.overwrite(
                          imported.s,
                          imported.e,
                          imported.t == DYNAMIC_IMPORT
                            ? `"${resolved}"`
                            : resolved
                        );
                      }
                    });

                    s.overwrite(content.start, content.end, ss.toString());
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
