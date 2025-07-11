import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import yargs from "yargs";
import color from "kleur";

import ora from "ora";
import { confirm, input, select } from "@inquirer/prompts";

import { parse } from "yaml";
import { Octokit } from "@octokit/core";
import { downloadTemplate } from "giget";

// to avoid any confusion about console.log() not doing anything
const new_line = () => console.log();

const get_pkg = (path: string) => JSON.parse(fs.readFileSync(path, "utf-8"));

const repo = "stack54";
const owner = "joshamaju";
const templates_dir = "templates";

const pkg_path = fileURLToPath(new URL("../package.json", import.meta.url));

const pkg = get_pkg(pkg_path);

console.log(`${pkg.name} ${pkg.version}`);

const arg = process.argv.slice(2);

const args = await yargs(arg).argv;

let [name] = args._;

if (!name || typeof name !== "string") {
  try {
    name = await input({ message: "Project name" });

    if (name.trim() == "") {
      console.error(color.red("Please provide a project name"));
      process.exit(1);
    }
  } catch (error) {
    process.exit(1);
  }
}

const t = args.t ?? args.template;
let template = typeof t === "string" ? t : null;

if (!template) {
  new_line();

  const spinner = ora("No template provided, getting templates...").start();

  const octokit = new Octokit();

  try {
    const response = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      { owner, repo, path: templates_dir }
    );

    spinner.stop();

    try {
      const templates = Array.isArray(response.data)
        ? response.data.filter((_) => _.type == "dir").map((_) => _.name)
        : [];

      const configs = await Promise.all(
        templates.map(async (template) => {
          const path = `${templates_dir}/${template}/config.yaml`;

          try {
            const { data } = await octokit.request(
              "GET /repos/{owner}/{repo}/contents/{path}",
              { repo, path, owner }
            );

            if ("type" in data && data.type == "file") {
              const content = Buffer.from(data.content, "base64");
              const { features } = parse(content.toString("utf-8"));
              return [template, features as string[]] as const;
            }
          } catch (error) {}

          return template;
        })
      );

      template = await select({
        message: "Select a template",
        choices: configs.map((_) => {
          const [name, features] = Array.isArray(_) ? _ : [_];
          return { name: features ? features.join(" + ") : name, value: name };
        }),
      });
    } catch (error) {
      process.exit(0);
    }
  } catch (error: any) {
    if (error.name == "HttpError") {
      spinner.fail(
        "Unable to download templates, check your internet connection"
      );

      process.exit(1);
    }
  }
}

const dir = path.join(process.cwd(), name);

if (fs.existsSync(dir)) {
  const files = fs.readdirSync(dir);

  if (files.length > 0) {
    const project_name = color.cyan(color.italic(name));
    const message = `${project_name} directory already exists, continue?`;

    try {
      const continue_ = await confirm({ message, default: false });
      if (!continue_) process.exit(0);
      fs.rmSync(dir, { recursive: true });
    } catch (error) {
      process.exit(1);
    }
  }
}

new_line();

const spinner = ora("creating project...").start();

await downloadTemplate(`gh:${owner}/${repo}/${templates_dir}/${template}`, {
  dir,
});

const metadata_path = path.join(dir, "package.json");
const metadata = get_pkg(metadata_path);

fs.writeFileSync(
  metadata_path,
  JSON.stringify({ ...metadata, name }, undefined, 2)
);

fs.rmSync(path.join(dir, "config.yaml"));

spinner.stop();

console.log("Your project is ready, next steps:\n");

const steps = [`cd ${name}`, "git init", "npm install", "npm run dev"];

console.log(steps.map((step) => `${color.dim("-")} ${step}`).join("\n"));
