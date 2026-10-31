import MagicString from "magic-string";
import { dedent } from "ts-dedent";

import type { PreprocessorGroup } from "svelte/compiler";
import { parse, preprocess } from "svelte/compiler";

import { to_fs } from "stack54/internals";
import { ResolvedConfig } from "stack54/config";
import { walk_ast } from "./walk.js";

type Attributes = Record<string, string | boolean>;

type Element = {
  type: string;
  children?: Array<any>;
  start: number;
  end: number;
};

type Loc = { start: number; end: number };

type Head = Loc & { content: Loc };

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

  const ast = parse(processed.code, { modern: false });

  if (!ast.instance) return;

  const opts = script.attributes[CONFIG];
  const directive = script.attributes[KEY];

  const s = new MagicString(processed.code);

  let props: Array<{ name: string; kind: string }> = [];

  for (const node of ast.instance.content.body) {
    if (
      node.type == "ExportNamedDeclaration" &&
      node.declaration?.type == "VariableDeclaration"
    ) {
      const { kind } = node.declaration;

      const [declaration] = node.declaration.declarations;

      if (declaration.id.type == "ObjectPattern") {
        for (const property of declaration.id.properties) {
          if (
            property.type == "Property" &&
            property.key.type == "Identifier"
          ) {
            props.push({ kind, name: property.key.name });
          }
        }
      }

      if (declaration.id.type == "ArrayPattern") {
        for (const element of declaration.id.elements) {
          if (element?.type == "Identifier") {
            props.push({ kind, name: element.name });
          }
        }
      }

      if (declaration.id.type == "Identifier") {
        props.push({ kind, name: declaration.id.name });
      }
    }
  }

  let svelte_head: Head | undefined;

  walk_ast(ast.html, {
    enter(node) {
      const node_: Element = node as any;

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

  const markup = s.toString().replace(SFC_script_style, "");

  const code_ = dedent/*html*/ `
  ${module}
  
  <script ${attributes.join(" ")}>
    import {stringify} from "stack54/data";
    ${script.content}
    const __props__ = {${props.map((prop) => prop.name).join(",")}};
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
