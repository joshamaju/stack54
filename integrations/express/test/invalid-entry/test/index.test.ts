import { spawn } from "node:child_process";
import { expect, it } from "vitest";

it("should not attach to vite dev server", async () => {
  const deffered = Promise.withResolvers<number>();

  const playwright = spawn("pnpm", ["test:e2e"], {
    env: process.env,
    cwd: process.cwd(),
  });

  playwright.on("close", (code) => deffered.resolve(code ?? 0));

  expect(await deffered.promise).toBe(1);
});
