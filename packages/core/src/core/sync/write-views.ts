import path from "node:path";
import { dedent } from "ts-dedent";
import { relative_path } from "../../vite/utils/filesystem.js";
import { Config } from "../config/options.js";

export const types_template = (
  templates: string[],
  { directories, typescript }: Config,
  { cwd, outDir }: { outDir: string; cwd: string }
) => {
  const { includeExtension } = typescript.views;
  const prefix = path.join(cwd, directories.templates);

  return dedent`
    import {ComponentProps} from 'svelte';
      
    ${templates
      .map((file, i) => `import $${i} from "${relative_path(outDir, file)}";`)
      .join("\n")}
        
    declare module "@leanweb/fullstack/render" {
        interface Views {
            ${templates
              .map((file, i) => {
                const id = file.replace(
                  prefix.endsWith("/") ? prefix : `${prefix}/`,
                  ""
                );

                const { dir, name } = path.parse(id);

                const key = path.join(dir, name);
                const value = `ComponentProps<$${i}>`;

                const key_value = [`"${key}": ${value}`];

                if (includeExtension) {
                  key_value.push(`"${id}": ${value}`);
                }

                return key_value;
              })
              .flat()
              .join(",\n")}
        }
    }
    `;
};
