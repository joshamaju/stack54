import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

  const pkg = fs.readFileSync(
    fileURLToPath(new URL("../../../package.json", import.meta.url)),
    "utf-8"
  );

  const { name } = JSON.parse(pkg);

  return dedent`
    import {ComponentProps} from 'svelte';
    import {Options as TemplateOptions} from "${name}/types";
      
    ${templates
      .map((file, i) => `import $${i} from "${relative_path(outDir, file)}";`)
      .join("\n")}

      interface Templates {
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
        
    declare module "${name}/render" {
        interface Views extends Templates {}
    }

    declare module "hono" {
      interface ContextRenderer {
        <V extends Templates, K extends keyof V>(content: K, props: V[K], options?: TemplateOptions): Response | Promise<Response>;
      }
    }
    `;
};
