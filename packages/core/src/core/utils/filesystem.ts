import * as fs from "node:fs/promises";
import * as path from "node:path";

export function posixify(str: string) {
  return str.replace(/\\/g, "/");
}

export function to_fs(str: string) {
  str = posixify(str);
  return `/@fs${
    // Windows/Linux separation - Windows starts with a drive letter, we need a / in front there
    str.startsWith("/") ? "" : "/"
  }${str}`;
}

export async function copy(srcDir: string, destDir: string) {
  await fs.mkdir(destDir, { recursive: true });

  const files = await fs.readdir(srcDir);

  for (const file of files) {
    const srcFile = path.resolve(srcDir, file);

    if (srcFile === destDir) {
      continue;
    }

    const destFile = path.resolve(destDir, file);
    const stat = await fs.stat(srcFile);

    if (stat.isDirectory()) {
      await copy(srcFile, destFile);
    } else {
      await fs.copyFile(srcFile, destFile);
    }
  }
}
