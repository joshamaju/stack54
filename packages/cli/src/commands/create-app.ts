import fs from "node:fs";
import path from "node:path";

import color from "kleur";
import enquirer from "enquirer";
import * as prompt from "@clack/prompts";
import { downloadTemplate } from "giget";

const templates = "github:joshamaju/stack54/templates";

export async function create_app({
  name,
  template,
}: {
  name: string;
  template: string;
}) {
  if (fs.existsSync(name)) {
    if (fs.readdirSync(name).length > 0) {
      const response = await enquirer.prompt({
        name: "use",
        initial: false,
        type: "confirm",
        message: `Directory (${name}) not empty, continue?`,
      });

      const use_non_empty_dir = (response as any).use;

      if (prompt.isCancel(use_non_empty_dir) || !use_non_empty_dir) {
        process.exit(1);
      }

      fs.rmSync(name, { recursive: true });
    }
  }

  const s = prompt.spinner();

  s.start("Setting up project...");

  try {
    await downloadTemplate(`${templates}/${template}`, { dir: name });
  } catch {
    s.stop(color.red(`Unable to download template ${template}`));
    return;
  }

  const pkg_file = path.join(name, "package.json");

  const pkg = JSON.parse(fs.readFileSync(pkg_file, "utf-8"));

  fs.writeFileSync(pkg_file, JSON.stringify({ ...pkg, name }, null, 2));

  s.stop("✨ Project created");

  const next_steps = [`cd ${name}`, "pnpm i", "pnpm dev"];

  prompt.outro(
    `Next steps\n\n${next_steps.map((_) => color.dim(`   - ${_}`)).join("\n")}`
  );
}
