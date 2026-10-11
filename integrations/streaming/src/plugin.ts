import MagicString from "magic-string";
import type { Integration, ResolvedConfig, UserConfig } from "stack54/config";
import { compile, preprocess, walk } from "svelte/compiler";
import { dedent } from "ts-dedent";
import type { Plugin } from "vite";

export default function streamingIntegration(): Integration {
  let config: ResolvedConfig;

  const plugin: Plugin = {
    name: "stack54:streaming",
    transform: {
      order: "pre",
      async handler(content, filename, options) {
        if (
          config.svelte.extensions.some((extension) =>
            filename.endsWith(extension),
          ) &&
          options?.ssr
        ) {
          const preprocessors = config.svelte.preprocess ?? [];

          const processed = await preprocess(content, preprocessors, {
            filename,
          });

          const { ast } = compile(processed.code, { filename });
          const code = new MagicString(processed.code, { filename });

          let counter = 0;
          const components = new Set<string>();
          const roots: any[] = [];
          const parents: any[] = [];

          // @ts-expect-error
          walk(ast.html, {
            enter(node) {
              // @ts-expect-error AwaitBlock is omitted from Svelte's public AST types.
              if (node.type == "AwaitBlock") {
                const parent = parents[parents.length - 1];
                if (parent) (parent.children ??= []).push(node);
                else roots.push(node);
                parents.push(node);
              }
            },
            leave(node) {
              // @ts-expect-error AwaitBlock is omitted from Svelte's public AST types.
              if (node.type == "AwaitBlock") parents.pop();
            },
          });

          /** Rewrites only direct child await blocks so nested ranges never overlap. */
          function renderRange(start: number, end: number, children: any[]) {
            const range = new MagicString(code.slice(start, end));
            for (const child of children.filter(
              (child) => child.start >= start && child.end <= end,
            )) {
              range.overwrite(
                child.start - start,
                child.end - start,
                renderAwait(child),
              );
            }
            return range.toString();
          }

          function renderAwait(node: any): string {
            const component = `Await_${counter++}`;
            components.add(component);

            const { error, value, expression, ..._ } = node;
            const then = _.then.children;
            const catch_ = _.catch.children;
            const awaitable = code.slice(expression.start, expression.end);

            return dedent`
                <${component} resolve={${awaitable}}>
                  ${
                    !_.pending.skip
                      ? `
                      <svelte:fragment slot="fallback">
                        ${renderRange(_.pending.start, _.pending.end, node.children ?? [])}
                      </svelte:fragment>
                      `
                      : ""
                  }

                  ${
                    !_.catch.skip
                      ? `
                      <svelte:fragment slot="error" let:error={${error.name}}>
                        ${renderRange(
                          catch_[0].start,
                          catch_[catch_.length - 1].end,
                          node.children ?? [],
                        )}
                      </svelte:fragment>`
                      : ""
                  }

                  ${
                    !_.then.skip
                      ? `
                      <svelte:fragment slot="default" let:value={${value?.name}}>
                        ${renderRange(then[0].start, then[then.length - 1].end, node.children ?? [])}
                      </svelte:fragment>
                    `
                      : ""
                  }
                </${component}>
                `;
          }

          for (const node of roots) {
            const { expression } = node;
            const awaitable = code.slice(expression.start, expression.end);
            code.overwrite(node.start, node.end, renderAwait(node));
          }

          const sepcifiers = [...components].map(
            (_) => `import ${_} from "stack54/components/Await";`,
          );

          if (components.size > 0) {
            if (ast.instance) {
              const { end, start } = ast.instance?.content as any;
              const script = new MagicString(code.slice(start, end));
              script.prepend(`${sepcifiers.join("\n")}\n`);
              code.update(start, end, script.toString());
            } else {
              code.prepend(`<script>${sepcifiers.join("\n")}</script>\n`);
            }
          }

          return { code: code.toString(), map: code.generateMap() };
        }
      },
    },
  };

  return {
    name: "stack54:streaming",
    config(_) {
      return { vite: { plugins: [plugin] } } satisfies UserConfig;
    },
    configResolved(config_) {
      config = config_;
    },
  };
}
