import MagicString from "magic-string";
import { dedent } from "ts-dedent";

import type { PreprocessorGroup } from "svelte/compiler";
import { parse, preprocess, walk } from "svelte/compiler";
import { BaseNode, Element } from "svelte/types/compiler/interfaces";

import { to_fs } from "stack54/internals";
import { ResolvedConfig } from "stack54/config";

type Attributes = Record<string, string | boolean>;

type Loc = { start: number; end: number };

type Slot = Loc & { name?: string };

type Head = Loc & { content: Loc };

function visit(
  node: BaseNode,
  visitor: (node: BaseNode) => BaseNode
): BaseNode {
  if (node.children) {
    node.children = node.children.map((_) => visit(_, visitor));
  }

  return visitor(node);
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

  const slots: Array<Slot> = [];
  let svelte_head: Head | undefined;

  // @ts-expect-error
  walk(ast.html, {
    enter(node) {
      // @ts-expect-error
      visit(node, (node) => {
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

        if (node.type == "Slot") {
          const name_attr = node_.attributes.find(
            (attr) => attr.type == "Attribute" && attr.name == "name"
          );

          const name = name_attr?.value.find((val: any) => val.type == "Text");

          slots.push({ ...node, name: name?.data });
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

  slots.forEach(({ end, start, name }) => {
    const slot = s.slice(start, end);
    const attr = name ? `name="${name}"` : "";
    const content = `<stack54-slot style="display:contents;" ${attr}>${slot}</stack54-slot>`;
    s.overwrite(start, end, content);
  });

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
