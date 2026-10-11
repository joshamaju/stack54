import * as fs from "node:fs/promises";

import { copy } from "../utils/filesystem.js";

function is_missing_file(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

export async function copy_server_assets(sourceDir: string, targetDir: string) {
  try {
    await fs.access(sourceDir);
  } catch (error) {
    if (is_missing_file(error)) return;
    throw error;
  }

  /** Vite emits SSR-referenced files under the server output; move them to the
   * shared client asset directory after copying so the server tree stays lean.
   */
  await copy(sourceDir, targetDir);
  await fs.rm(sourceDir, { recursive: true });
}
