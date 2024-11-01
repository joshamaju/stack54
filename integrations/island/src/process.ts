import MagicString from "magic-string";
import { dedent } from "ts-dedent";

import type { PreprocessorGroup } from "svelte/compiler";
import { parse, preprocess, walk } from "svelte/compiler";
import { BaseNode, Element } from "svelte/types/compiler/interfaces";

import { ResolvedConfig } from "stack54/config";
import { to_fs } from "stack54/internals";

type Attributes = Record<string, string | boolean>;

type Block = { content: string; attributes: Attributes };

type Slot = {
  end: number;
  start: number;
  name?: string;
};

type Loc = { start: number; end: number };

const makeAttrs = (attrs: Attributes) => {
  return Object.entries(attrs).map(([k, v]) =>
    typeof v == "boolean" ? `${k}` : `${k}="${v}"`
  );
};

const makeBlock = (tag: string, { content, attributes }: Block) => {
  return `<${tag} ${makeAttrs(attributes).join(" ")}>${content}</${tag}>`;
};

const KEY = "island";
const CONFIG = "value";

export async function makeIsland(
  code: string,
  filename: string,
  config: ResolvedConfig
) {
  let style: Block | undefined;
  let module: Block | undefined;
  let island: Block | undefined;
  let head: (Loc & { content: Loc }) | undefined;

  const get_island: PreprocessorGroup = {
    name: "is-island",
    style({ content, attributes }) {
      style = { content, attributes };
    },
    script({ attributes, content }) {
      if ("context" in attributes) {
        module = { attributes, content };
      }

      if (KEY in attributes) {
        island = { content, attributes };
      }
    },
  };

  const preprocess_ = config.svelte.preprocess;

  const processors = [
    ...(preprocess_
      ? Array.isArray(preprocess_)
        ? preprocess_
        : [preprocess_]
      : []),
    get_island,
  ];

  const processed = await preprocess(code, processors, { filename });

  if (island) {
    const opts = island.attributes[CONFIG];
    const directive = island.attributes[KEY];

    const ast = parse(processed.code);
    const ms = new MagicString(processed.code);

    let props: Array<{ name: string; kind: string }> = [];

    if (ast.instance) {
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
    }

    function visit(
      node: BaseNode,
      visitor: (node: BaseNode) => BaseNode
    ): BaseNode {
      if (node.children) {
        node.children = node.children.map((_) => visit(_, visitor));
      }

      return visitor(node);
    }

    const slots: Array<Slot> = [];

    // @ts-expect-error
    walk(ast.html, {
      enter(node) {
        // console.log(inspect(node, false, Infinity));

        // @ts-expect-error
        visit(node, (node) => {
          const node_: Element = node as any;

          if (node_.type == "Head") {
            const first = node_.children?.[0];
            const last = node_.children?.[node_.children.length - 1];

            // console.log(node_.children);

            if (first && last) {
              head = {
                end: node_.end,
                start: node_.start,
                content: { start: first.start, end: last.end },
              };

              // console.log(ms.slice(first.start, last.end));
            }
          }

          if (node.type == "Slot") {
            const name_attr = node_.attributes.find(
              (attr) => attr.type == "Attribute" && attr.name == "name"
            );

            const name = name_attr?.value.find(
              (val: any) => val.type == "Text"
            );

            slots.push({ ...node, name: name?.data });
          }

          return node;
        });
      },
    });

    delete island.attributes[KEY];
    delete island.attributes[CONFIG];

    const attributes = makeAttrs(island.attributes);

    const value = opts ? `${JSON.stringify(opts)}` : "undefined";

    let head_ = "";

    if (head) {
      const { end, start, content } = head;
      head_ = ms.slice(content.start, content.end);
      ms.overwrite(start, end, "");
    }

    slots.forEach(({ end, start, name }) => {
      const slot = ms.slice(start, end);
      const name_ = name ? `name="${name}"` : "";
      const content = `<stack54-slot style="display:contents;" ${name_}>${slot}</stack54-slot>`;
      ms.overwrite(start, end, content);
    });

    const markup = ms
      .toString()
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "");

    const script = dedent/*html*/ `
    ${module ? makeBlock("script", module) : ""}
    
    <script ${attributes.join(" ")}>
      import {stringify} from "stack54/data";
      
      ${island.content}
      
      const __serialized__ = {${props.map((prop) => prop.name).join(",")}};
    </script>
    
    <svelte:head>
      ${head_}
      
      <script type="module">
        import '@stack54/island/hydrate';
        import * as directives from "@stack54/island/directives";
        
        const directive = directives["${directive}"];
        const load = () => import("${to_fs(filename)}");

        window["${filename}"] = directive(load, {value: ${value}});
        window.dispatchEvent(new Event("stack54:${directive}"));
      </script>
    </svelte:head>
    
    <stack54-island file="${filename}" directive="${directive}" style="display:contents;" props="{stringify(__serialized__)}">
      ${markup}
    </stack54-island>
    
    ${style ? makeBlock("style", style) : ""}
    `;

    return script;
  }
}
