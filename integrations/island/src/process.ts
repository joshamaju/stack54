import MagicStringStack from "magic-string-stack";
import { dedent } from "ts-dedent";

import type { PreprocessorGroup } from "svelte/compiler";
import { parse, preprocess, walk } from "svelte/compiler";
import { BaseNode, Element } from "svelte/types/compiler/interfaces";

import { ResolvedConfig } from "stack54/config";
import { arraify, to_fs } from "stack54/internals";

type Attributes = Record<string, string | boolean>;

type Block = { content: string; attributes: Attributes };

type Slot = {
  end: number;
  start: number;
  name?: string;
};

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

  const processors = [...arraify(config.svelte.preprocess ?? []), get_island];

  const processed = await preprocess(code, processors, { filename });

  if (island) {
    const opts = island.attributes[CONFIG];
    const directive = island.attributes[KEY];

    const ast = parse(processed.code);

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
        // @ts-expect-error
        visit(node, (node) => {
          if (node.type == "Slot") {
            const node_: Element = node as any;

            const name_attr = node_.attributes.find(
              (attr) => attr.type == "Attribute" && attr.name == "name"
            );

            const name = name_attr?.value.find(
              (val: any) => val.type == "Text"
            );

            slots.push({ ...node, name: name?.data });
          }
        });
      },
    });

    const ms = new MagicStringStack(processed.code);

    slots.forEach(({ end, start, name }) => {
      const slot = ms.slice(start, end);
      const name_ = name ? `name="${name}"` : "";
      const content = `<stack54-slot style="display:contents;" ${name_}>${slot}</stack54-slot>`;
      ms.overwrite(start, end, content);
    });

    ms.commit();

    const markup = ms
      .toString()
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "");

    delete island.attributes[KEY];
    delete island.attributes[CONFIG];

    const attributes = makeAttrs(island.attributes);

    const value = opts ? `${JSON.stringify(opts)}` : "undefined";

    const script = dedent/*html*/ `
    ${module ? makeBlock("script", module) : ""}
    
    <script ${attributes.join(" ")}>
      import {raw_encode} from "stack54/data";
      
      ${island.content}
      
      const __serialized__ = {${props.map((prop) => prop.name).join(",")}};
    </script>
    
    <svelte:head>
      <script type="module">
        import '@stack54/island/hydrate';
        import * as directives from "@stack54/island/directives";
        
        const directive = directives["${directive}"];
        const load = () => import("${to_fs(filename)}");

        window["${filename}"] = directive(load, {value: ${value}});
        window.dispatchEvent(new Event("stack54:${directive}"));
      </script>
    </svelte:head>
    
    <stack54-island file="${filename}" directive="${directive}" style="display:contents;" props="{raw_encode(__serialized__)}">
      ${markup}
    </stack54-island>
    
    ${style ? makeBlock("style", style) : ""}
    `;

    return script;
  }
}
