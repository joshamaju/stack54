import { spawn } from "node:child_process";
import { expect, it } from "vitest";

it("should not attach to vite dev server", async () => {
  const deffered = Promise.withResolvers<number>();

  const playwright = spawn("pnpm", ["test:e2e"], {
    env: process.env,
    cwd: process.cwd(),
  });

  let output = "";
  playwright.stderr.on("data", (data) => (output += data));
  playwright.stdout.on("data", (data) => (output += data));

  playwright.on("close", (code) => {
    console.log("exit code", code);
    console.log(output);
    deffered.resolve(code ?? 0);
  });

  expect(await deffered.promise).toBe(1);
});
