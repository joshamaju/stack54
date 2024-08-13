import { dedent } from "ts-dedent";

import type { PreprocessorGroup } from "svelte/compiler";
import { parse, preprocess } from "svelte/compiler";

import { ResolvedConfig } from "../../config/index.js";
import { to_fs } from "../../utils/filesystem.js";
import { arraify } from "../../utils/index.js";

type Attr = Record<string, string | boolean>;

type Block = { content: string; attributes: Attr };

const makeAttrs = (attrs: Attr) => {
  return Object.entries(attrs).map(([k, v]) =>
    typeof v == "boolean" ? `${k}` : `${k}="${v}"`
  );
};

const makeBlock = (tag: string, { content, attributes }: Block) => {
  return `<${tag} ${makeAttrs(attributes).join(" ")}>${content}</${tag}>`;
};

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

      if ("client" in attributes) {
        island = { content, attributes };
      }
    },
  };

  const _preprocess = config.svelte.preprocess ?? [];

  const processors = [...arraify(_preprocess), get_island];

  const processed = await preprocess(code, processors, {
    filename,
  });

  if (island) {
    const directive = island.attributes.client;

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

    // const s = new MagicString(processed.code);

    // const markup = s
    //   .slice(ast.html.start, ast.html.end)
    //   .replace(
    //     /<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g,
    //     ""
    //   );

    const markup = processed.code.replace(
      /<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g,
      ""
    );

    const { client, ...attr } = island.attributes;

    const attributes = makeAttrs(attr);

    const serialized = props.map((prop) => prop.name);

    const script = dedent`
    ${module ? makeBlock("script", module) : ""}
    
    <script ${attributes.join(" ")}>
        import {encode} from "stack54/data";
        
        ${island.content}
              
        const __id__ = "island_${Date.now()}";
        const __serialized__ = {${serialized.join(",")}};
    </script>
    
    <svelte:head>
        {@html encode(__serialized__, {id: __id__})}
        
        <script type="module">
            import { decode } from "stack54/data";
            import { hydrate } from 'stack54/client/island';
            const load = () => import("${to_fs(filename)}");
            load().then(module => hydrate(module.default));
        </script>
    </svelte:head>
    
    <stack54-island key="{__id__}" style="display:contents;">
        ${markup}
    </stack54-island>
    
    ${style ? makeBlock("style", style) : ""}`;

    return script;
  }
}
