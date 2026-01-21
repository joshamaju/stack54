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
        if (filename.endsWith(".svelte") && options?.ssr) {
          const preprocessors = config.svelte.preprocess ?? [];

          const processed = await preprocess(content, preprocessors, {
            filename,
          });

          const { ast } = compile(processed.code, { filename });
          const code = new MagicString(processed.code, { filename });

          let counter = 0;
          const components = new Set<string>();

          // @ts-expect-error
          walk(ast.html, {
            enter(node) {
              // @ts-expect-error
              if (node.type == "AwaitBlock") {
                const component = `Await_${counter++}`;

                components.add(component);

                const { error, value, expression, ..._ } = node as any;

                const then = _.then.children;
                const catch_ = _.catch.children;

                const awaitable = code.slice(expression.start, expression.end);

                const segment = dedent`
                <${component} resolve={${awaitable}}>
                  ${
                    !_.pending.skip
                      ? `
                      <svelte:fragment slot="fallback">
                        ${code.slice(_.pending.start, _.pending.end)}
                      </svelte:fragment>
                      `
                      : ""
                  }

                  ${
                    !_.catch.skip
                      ? `
                      <svelte:fragment slot="error" let:error={${error.name}}>
                        ${code.slice(
                          catch_[0].start,
                          catch_[catch_.length - 1].end,
                        )}
                      </svelte:fragment>`
                      : ""
                  }

                  ${
                    !_.then.skip
                      ? `
                      <svelte:fragment slot="default" let:value={${value?.name}}>
                        ${code.slice(then[0].start, then[then.length - 1].end)}
                      </svelte:fragment>
                    `
                      : ""
                  }
                </${component}>
                `;

                code.overwrite(_.start, _.end, segment);
              }
            },
          });

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
