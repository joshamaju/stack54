import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";

import { copy_server_assets } from "../src/core/build/assets";

let tempDir: string;

afterEach(async () => {
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
  tempDir = "";
});

async function create_temp_dir() {
  tempDir = await mkdtemp(join(tmpdir(), "stack54-build-assets-"));
  return tempDir;
}

it("should skip copying when the optional server assets directory is absent", async () => {
  const root = await create_temp_dir();

  await expect(
    copy_server_assets(join(root, "missing-assets"), join(root, "output")),
  ).resolves.toBeUndefined();
});

it("should surface server asset copy failures", async () => {
  const root = await create_temp_dir();
  const sourceFile = join(root, "not-a-directory");
  await writeFile(sourceFile, "content");

  await expect(
    copy_server_assets(sourceFile, join(root, "output")),
  ).rejects.toThrow();
});
