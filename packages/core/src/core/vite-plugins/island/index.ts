import { Plugin } from "vite";

import { Integration, ResolvedConfig } from "../../config/index.js";
import { is_view, parse_id } from "../../utils/view.js";
import { makeIsland } from "./preprocess.js";
import { ConfigEnv } from "../../integrations/hooks.js";

let islands = new Map<
  string,
  { code: string; original: string; loaded: boolean }
>();

// export function islandPlugin(config: ResolvedConfig): Plugin {
//   return {
//     name: "stack54:island",
//     buildStart() {
//       islands = new Map();
//     },
//     load: {
//       order: "pre",
//       handler(id) {
//         if (is_view(parse_id(id).filename)) {
//           const island = islands.get(id);

//           if (island) {
//             islands.set(id, { ...island, loaded: true });
//             return island.original;
//           }
//         }
//       },
//     },
//     transform: {
//       order: "pre",
//       async handler(code, id) {
//         const { filename } = parse_id(id);

//         if (is_view(filename)) {
//           /**
//            * We wrap the original component and insert a script that imports itself
//            * for hydration on the client. We need to ensure that the client script doesn't
//            * import this wrapped version, but the original version to avoid recursive hydration
//            * which will blow out the stack
//            */

//           const processed_island = islands.get(id);

//           if (processed_island?.loaded) return;

//           let style: Block | undefined;
//           let module: Block | undefined;
//           let island: Block | undefined;

//           const get_island: PreprocessorGroup = {
//             name: "is-island",
//             style({ content, attributes }) {
//               style = { content, attributes };
//             },
//             script({ attributes, content }) {
//               if ("context" in attributes) {
//                 module = { attributes, content };
//               }

//               if ("client" in attributes) {
//                 island = { content, attributes };
//               }
//             },
//           };

//           const _preprocess = config.svelte.preprocess ?? [];

//           const processors = [...arraify(_preprocess), get_island];

//           const processed = await preprocess(code, processors, {
//             filename: id,
//           });

//           if (island) {
//             const directive = island.attributes.client;

//             const ast = parse(processed.code);

//             let props: Array<{ name: string; kind: string }> = [];

//             if (ast.instance) {
//               for (const node of ast.instance.content.body) {
//                 if (
//                   node.type == "ExportNamedDeclaration" &&
//                   node.declaration?.type == "VariableDeclaration"
//                 ) {
//                   const { kind } = node.declaration;

//                   const [declaration] = node.declaration.declarations;

//                   if (declaration.id.type == "ObjectPattern") {
//                     for (const property of declaration.id.properties) {
//                       if (
//                         property.type == "Property" &&
//                         property.key.type == "Identifier"
//                       ) {
//                         props.push({ kind, name: property.key.name });
//                       }
//                     }
//                   }

//                   if (declaration.id.type == "ArrayPattern") {
//                     for (const element of declaration.id.elements) {
//                       if (element?.type == "Identifier") {
//                         props.push({ kind, name: element.name });
//                       }
//                     }
//                   }

//                   if (declaration.id.type == "Identifier") {
//                     props.push({ kind, name: declaration.id.name });
//                   }
//                 }
//               }
//             }

//             const id_ = `island_${Date.now()}`;

//             // const s = new MagicString(processed.code);

//             // const markup = s
//             //   .slice(ast.html.start, ast.html.end)
//             //   .replace(
//             //     /<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g,
//             //     ""
//             //   );

//             const markup = processed.code.replace(
//               /<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g,
//               ""
//             );

//             const { client, ...attr } = island.attributes;

//             const attributes = makeAttrs(attr);

//             const serialized = props.map((prop) => prop.name);

//             const script = dedent`
//             ${module ? makeBlock("script", module) : ""}

//             <script ${attributes.join(" ")}>
//               import {encode} from "stack54/data";

//               ${island.content}

//               const __id__ = "${id_}";
//               const __serialized__ = {${serialized.join(",")}};
//             </script>

//             <svelte:head>
//               {@html encode(__serialized__, {id: __id__})}

//               <script type="module">
//                 import { decode } from "stack54/data";
//                 import { hydrate } from 'stack54/client/island';
//                 import Component from "${to_fs(filename)}";
//                 hydrate(Component)
//                 // customElements.define("stack54-island", hydrate(Component));
//               </script>
//             </svelte:head>

//             <stack54-island key="{__id__}" style="display:contents;">
//               ${markup}
//             </stack54-island>

//             ${style ? makeBlock("style", style) : ""}
//             `;

//             // console.log(script);

//             islands.set(id, { loaded: false, original: code, code: script });

//             return script;
//           }
//         }
//       },
//     },
//   };
// }

export function islandPlugin(): Plugin {
  return {
    name: "stack54:island",
    buildStart() {
      islands = new Map();
    },
    load: {
      order: "pre",
      handler(id) {
        if (is_view(parse_id(id).filename)) {
          const island = islands.get(id);

          if (island) {
            islands.set(id, { ...island, loaded: true });
            return island.original;
          }
        }
      },
    },
  };
}

export function islandIntegration(): Integration {
  let env: ConfigEnv;
  let config: ResolvedConfig;

  return {
    name: "stack54:island",
    config(_, env_) {
      env = env_;

      return {
        vite: {
          plugins: [islandPlugin()],
        },
      };
    },
    configResolved(config_) {
      config = config_;
    },
    transformHtml: {
      order: "pre",
      async handle(code, id) {
        const { filename } = parse_id(id);
        const island = await makeIsland(code, filename, config);
        return island;
      },
    },
    transform: {
      order: "pre",
      async handle(code, id) {
        // console.log("making island", code);

        if (env.command == "build") return;

        const { filename } = parse_id(id);

        if (is_view(filename)) {
          /**
           * We wrap the original component and insert a script that imports itself
           * for hydration on the client. We need to ensure that the client script doesn't
           * import this wrapped version, but the original version to avoid recursive hydration
           * which will blow out the stack
           */

          const processed_island = islands.get(id);

          if (processed_island?.loaded) return;

          const island = await makeIsland(code, filename, config);

          if (island) {
            islands.set(id, { loaded: false, original: code, code: island });
            return island;
          }
        }
      },
    },
  };
}
