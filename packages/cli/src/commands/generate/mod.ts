import fs from "node:fs";
import path from "node:path";

import color from "kleur";
import inflection from "inflection";

import * as template from "./templates.js";

export function create_controller({
  name,
  param,
  directory,
}: {
  name: string;
  param?: string;
  directory: string;
}) {
  const dir = path.join(directory, name);
  const router = path.join(dir, "router.ts");
  const controller = path.join(dir, "controller.ts");

  if (!param) {
    param = inflection.singularize(name);
  }

  fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(controller, template.controller({ param }));
  fs.writeFileSync(router, template.router({ param }));

  console.log(color.green(`✓ Created controller ${controller}`));
}

export function create_views({
  name,
  directory,
}: {
  name: string;
  directory: string;
}) {
  const dir = path.join(directory, name);

  const create = path.join(dir, "new.page.svelte");
  const index = path.join(dir, "index.page.svelte");

  const plural = inflection.pluralize(name);
  const singular = inflection.singularize(name);

  const title_plural = inflection.capitalize(plural);
  const title_singular = inflection.capitalize(singular);

  const names = { singular, plural };
  const titles = { singular: title_singular, plural: title_plural };

  fs.mkdirSync(dir, { recursive: true });

  const views = [
    [index, template.view_index],
    [create, template.view_new],
  ] as const;

  for (const [view, fn] of views) {
    fs.writeFileSync(view, fn(names, titles));
  }

  console.log(
    views.map(([view]) => color.green(`- Created view ${view}`)).join("\n")
  );
}
