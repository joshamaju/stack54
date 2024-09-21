import { Plugin } from "vite";
import { Integration, ResolvedConfig } from "stack54/config";
import { is_view } from "stack54/internals";
import { makeIsland } from "./process.js";

type Island = { code: string; original: string; complete: boolean };

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

export default function islandIntegration(): Integration {
  let config: ResolvedConfig;
  let env: { command: string };

  let islands = new Map<string, Island>();

  function vitePlugin(): Plugin {
    return {
      name: "stack54:island",
      load: {
        order: "pre",
        handler(id) {
          const [filename] = id.split("?");

          /**
           * We wrap the original component and insert a script that imports itself
           * for hydration on the client. We need to ensure that the client script doesn't
           * load the wrapped version, but the original version, to avoid recursively making it an island
           */
          if (is_view(filename)) {
            const island = islands.get(id);

            if (island) {
              islands.set(id, { ...island, complete: true });
              return island.original;
            }
          }
        },
      },
      configureServer(server) {
        const fn = (file: string) => {
          if (islands.has(file)) islands.delete(file);
        };

        server.watcher.on("change", fn);
        server.watcher.on("unlink", fn);
      },
    };
  }

  return {
    name: "stack54:island",
    config(_, env_) {
      env = env_;

      return {
        vite: {
          plugins: [vitePlugin()],
        },
      };
    },
    configResolved(config_) {
      config = config_;
    },
    transformHtml: {
      order: "pre",
      async handle(code, id) {
        // only runs during build
        const [filename] = id.split("?");
        const island = await makeIsland(code, filename, config);
        return island;
      },
    },
    transform: {
      order: "pre",
      async handle(code, id) {
        if (env.command == "build") return;

        const [filename] = id.split("?");

        if (is_view(filename)) {
          /**
           * If this is a second pass/transform as a result of the client script,
           * we need to skip making it an island to avoid recursive loads and transforms.
           *
           * This indicates that the cycle is complete, we've loaded the wrapped island server side
           * which gets sent to the browser as plain HTML that includes the hydration script which
           * triggered another import resolution to the original svelte component.
           *
           * So we remove every reference to this component to avoid returning old code on any other request
           */
          const processed_island = islands.get(id);

          if (processed_island?.complete) {
            islands.delete(id);
            return;
          }

          const island = await makeIsland(code, filename, config);

          if (island) {
            islands.set(id, { complete: false, original: code, code: island });
            return island;
          }
        }
      },
    },
  };
}
