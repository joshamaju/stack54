import * as fs from "node:fs"
import pkg from "../package.json" assert { type: "json" }

fs.writeFileSync(
  "./version.js",
  `
  // generated during release, do not modify
  export const VERSION = ${JSON.stringify(pkg.version)};
  `
)