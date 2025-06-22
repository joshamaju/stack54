import MagicString from "magic-string";
import { dedent } from "ts-dedent";

import { walk, type Node } from "estree-walker";
import type { AST, PreprocessorGroup } from "svelte/compiler";
import { parse, preprocess } from "svelte/compiler";

import { ResolvedConfig } from "stack54/config";
import { to_fs } from "stack54/internals";

type Attributes = Record<string, string | boolean>;

type Loc = { start: number; end: number };

type Slot = Loc & { name?: string };

type Head = Loc & { content: Loc };

function visit(
  node: Node,
  visitor: (node: AST.BaseNode) => AST.BaseNode
): AST.BaseNode {
  if ("children" in node) {
    node.children = (node.children as Node[]).map((_) => visit(_, visitor));
  }

  return visitor(node as AST.BaseNode);
}

const KEY = "island";
const CONFIG = "value";

const SFC_script_style = /<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g;

export async function make(
  code: string,
  filename: string,
  config: ResolvedConfig
) {
  let script: { content: string; attributes: Attributes } | undefined;

  const processor: PreprocessorGroup = {
    name: "is-island",
    script({ attributes, content }) {
      if (KEY in attributes) {
        script = { content, attributes };
      }
    },
  };

  const preprocess_ = config.svelte.preprocess ?? [];

  const processors = [
    ...(Array.isArray(preprocess_) ? preprocess_ : [preprocess_]),
    processor,
  ];

  const processed = await preprocess(code, processors, { filename });

  if (!script) return;

  const ast = parse(processed.code);

  if (!ast.instance) return;

  const opts = script.attributes[CONFIG];
  const directive = script.attributes[KEY];

  const s = new MagicString(processed.code);

  let snippets: Array<Slot> = [];
  let svelte_head: Head | undefined;

  let props = "{}";

  // Look for props `$props()`
  for (const node of ast.instance.content.body) {
    let should_continue = true;

    if (node.type === "VariableDeclaration" && node.declarations.length > 0) {
      for (const decl of node.declarations) {
        if (
          decl.init &&
          decl.init.type === "CallExpression" &&
          decl.init.callee.type == "Identifier" &&
          decl.init.callee.name === "$props"
        ) {
          // Simple `const props = $props()`
          if (decl.id.type == "Identifier") {
            props = decl.id.name;
          }

          // `const {prop1, prop2: prop_rename, prop2: prop_rename_with_value = 'value', ...rest} = $props()`
          if (decl.id.type === "ObjectPattern") {
            let members = [];

            for (const prop of decl.id.properties) {
              if (prop.type === "Property") {
                if (prop.key.type == "Identifier") {
                  const { value: val } = prop;
                  const value =
                    val.type == "Identifier"
                      ? val
                      : val.type == "AssignmentPattern"
                      ? val.left
                      : null;

                  if (value?.type == "Identifier") {
                    // Just in-case the prop get renamed during destructuring
                    members.push(`${prop.key.name}: ${value.name}`);
                  }
                }
              } else {
                // `const { /*...*/, ...rest} = $props()`
                if (prop.argument.type == "Identifier") {
                  members.push("..." + prop.argument.name);
                }
              }
            }

            props = `{${members.join(", ")}}`;
          }

          should_continue = false;
          break;
        }
      }
    }

    if (!should_continue) break;
  }

  walk(ast.html as Node, {
    enter(node) {
      visit(node, (node) => {
        const node_: any = node as any;

        if (node_.type == "Head") {
          const first = node_.children?.[0];
          const last = node_.children?.[node_.children.length - 1];

          if (first && last) {
            svelte_head = {
              end: node_.end,
              start: node_.start,
              content: { start: first.start, end: last.end },
            };
          }
        }

        if (node.type == "RenderTag") {
          const tag = node as AST.RenderTag;

          // Snippet `@render name()`
          if (
            tag.expression.type == "CallExpression" &&
            tag.expression.callee.type == "MemberExpression" &&
            tag.expression.callee.property.type == "Identifier"
          ) {
            const { name } = tag.expression.callee.property;
            snippets.push({ ...tag, name });
          }

          // Snippet with  optional chaining `@render name?.()`
          if (
            tag.expression.type == "ChainExpression" &&
            tag.expression.expression.type == "CallExpression" &&
            tag.expression.expression.callee.type == "Identifier"
          ) {
            const { name } = tag.expression.expression.callee;
            snippets.push({ ...tag, name });
          }
        }

        return node;
      });
    },
  });

  delete script.attributes[KEY];
  delete script.attributes[CONFIG];

  const attributes = Object.entries(script.attributes).map(([k, v]) =>
    typeof v == "boolean" ? `${k}` : `${k}="${v}"`
  );

  const value = opts ? `${JSON.stringify(opts)}` : "undefined";

  let css = "";
  let module = "";

  if (ast.module) {
    module = s.slice(ast.module.start, ast.module.end);
  }

  if (ast.css) {
    css = s.slice(ast.css.start, ast.css.end);
  }

  let head = "";

  if (svelte_head) {
    const { end, start, content } = svelte_head;
    head = s.slice(content.start, content.end);
    s.overwrite(start, end, "");
  }

  snippets = Object.values(
    Object.fromEntries(snippets.map((_) => [_.name, _]))
  );

  snippets.forEach(({ end, start, name }) => {
    const slot = s.slice(start, end);
    const attr = name ? `name="${name}"` : "";
    const content = `<stack54-slot style="display:contents;" ${attr}>${slot}</stack54-slot>`;
    s.overwrite(start, end, content);
  });

  const markup = s.toString().replace(SFC_script_style, "");

  // Remove snippets from collected props to avoid JSON serialization error
  const code_ = dedent/*html*/ `
  ${module}
  
  <script ${attributes.join(" ")}>
    import {stringify} from "stack54/data";
    ${script.content}

    const __props__ = ${`Object.fromEntries(
      Object.entries(${props})
      .map(([k, v]) => [k, typeof v == 'function' ? null : v])
      .filter(([, v]) => v !== null)
      )`}
  </script>
  
  <svelte:head>
    ${head}
    
    <script type="module">
      import '@stack54/island/hydrate';
      import * as directives from "@stack54/island/directives";
      
      const directive = directives["${directive}"];
      const load = () => import("${to_fs(filename)}");

      window["${filename}"] = directive(load, {value: ${value}});
      window.dispatchEvent(new Event("stack54:${directive}"));
    </script>
  </svelte:head>
  
  <stack54-island file="${filename}" directive="${directive}" style="display:contents;" props="{stringify(__props__)}">
    ${markup}
  </stack54-island>
  
  ${css}`;

  return code_;
}
