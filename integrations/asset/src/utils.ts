// import * as fs_ from "node:fs";
import * as path from "node:path";
import { dedent } from "ts-dedent";
import * as fs from "node:fs/promises";
import { Assets } from "./types.js";

// /**
//  * Get a list of all files in a directory
//  * @param cwd - the directory to walk
//  * @param [dirs] - whether to include directories in the result
//  * @returns a list of all found files (and possibly directories) relative to `cwd`
//  */
// export function walk(cwd: string, dirs = false) {
//   const all_files: string[] = [];

//   function walk_dir(dir: string) {
//     const files = fs_.readdirSync(path.join(cwd, dir));

//     for (const file of files) {
//       const joined = path.join(dir, file);
//       const stats = fs_.statSync(path.join(cwd, joined));
//       if (stats.isDirectory()) {
//         if (dirs) all_files.push(joined);
//         walk_dir(joined);
//       } else {
//         all_files.push(joined);
//       }
//     }
//   }

//   return walk_dir(""), all_files;
// }

export async function walk(cwd: string, dirs = false): Promise<string[]> {
  const all_files: string[] = [];

  async function walk_dir(dir: string) {
    const files = await fs.readdir(path.join(cwd, dir));

    for (const file of files) {
      const joined = path.join(dir, file);
      const stats = await fs.stat(path.join(cwd, joined));

      if (stats.isDirectory()) {
        if (dirs) all_files.push(joined);
        await walk_dir(joined);
      } else {
        all_files.push(joined);
      }
    }
  }

  await walk_dir("");
  
  return all_files;
}

export function make_type(namespace: string, assets: Assets) {
  return dedent`declare namespace ${namespace} {
      ${Object.entries(assets)
        .map(([k, v]) => `export const ${k} = ${JSON.stringify(v)} as const;`)
        .join("\n")}
    }`;
}
