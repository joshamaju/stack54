import module from "node:module";
import * as path from "node:path";
import * as url from "node:url";

import type { PreprocessorGroup } from "svelte/compiler";
import * as compiler from "svelte/compiler";
import type { Element, Text } from "svelte/types/compiler/interfaces";

import * as lexer from "es-module-lexer";
import MagicString from "magic-string";

import { to_fs } from "../../utils/filesystem.js";
import { Rule, Tags, rules } from "./rules.js";

function isLocalPath(path: string) {
  /** Only relative references are rewritten; protocol, protocol-relative, and
   * root-relative URLs already have browser-visible addressing semantics.
   */
  return (
    !path.startsWith("http:") &&
    !path.startsWith("https:") &&
    !path.startsWith("//") &&
    (path.startsWith(".") || path.startsWith(".."))
  );
}

const DYNAMIC_IMPORT = 2;

export const RESOLVER_PREFIX = "/@resolve:";

/** Convert the tag/attribute rules to a lookup table for the AST visitor. */
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

      /** The compiler walker descends into children, so rewrite each node here
       * once to avoid applying overlapping edits to nested assets and scripts.
       */
      (compiler.walk as any)(ast.html, {
        enter(node: any) {
          if (node.type == "Element") {
            const node_: Element = node as any;

            const name = node_.name as Tags;
            const rules = rules_by_tag[name];

            if (rules) {
              /** Resolve relative asset attributes from the Svelte file's
               * directory, then expose the file through Vite's /@fs route
               * under the configured asset prefix.
               */
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
                  /** Lexer offsets let us rewrite only import specifiers while
                   * preserving the rest of the inline script verbatim.
                   */
                  const [imports] = lexer.parse(code);

                  const ss = new MagicString(code).trimLines();

                  imports.forEach((imported) => {
                    const slice = imported.n;

                    if (slice) {
                      let resolved = slice;
                      const { query, pathname } = url.parse(slice);

                      if (slice.startsWith("./") || slice.startsWith("../")) {
                        /** Relative imports use the source component as their
                         * base, even though Vite processes a generated view.
                         */
                        const file = path.resolve(parsed.dir, pathname!);
                        resolved = path.join(assetPrefix, to_fs(file));
                      } else {
                        try {
                          /** Package imports resolve through Node first; bare
                           * aliases fall through to Vite's resolver below.
                           */
                          resolved = to_fs(require.resolve(slice));
                        } catch (error) {
                          if (
                            !slice.startsWith("/@fs") &&
                            !slice.startsWith(RESOLVER_PREFIX)
                          ) {
                            const init = query || undefined;
                            const q = new url.URLSearchParams(init);
                            /** The resolver plugin needs the original importer
                             * to apply project aliases from the right directory.
                             */
                            q.set("file", filename);
                            resolved = `${RESOLVER_PREFIX}${pathname}?${q.toString()}`;
                          }
                        }
                      }

                      /** es-module-lexer marks dynamic imports separately, and
                       * those replacement spans need a quoted string literal.
                       */
                      ss.overwrite(
                        imported.s,
                        imported.e,
                        imported.t == DYNAMIC_IMPORT
                          ? `"${resolved}"`
                          : resolved,
                      );
                    }
                  });

                  s.overwrite(content.start, content.end, ss.toString());
                }
              }
            }
          }

          return node;
        },
      });

      return { code: s.toString(), map: s.generateMap() };
    },
  };
}
