import type { Template } from "stack54";
import { makeLocals } from "stack54/locals";
import { renderToString, renderToStream, isTemplate } from "stack54/render";

export async function engine(
  str: string | Template | Promise<Template>,
  options: object,
  fn: (e: any, rendered?: any) => void
) {
  let template = isTemplate(str) ? Promise.resolve(str) : str;

  const {
    cache,
    _locals,
    $stream,
    settings,
    $context = new Map(),
    ...props
  } = options as any;

  const stream: boolean | undefined = $stream;

  const local_keys = Object.keys(_locals);

  const _props = Object.fromEntries(
    Object.entries(props).filter(([k]) => !local_keys.includes(k))
  );

  const locals = makeLocals({ ..._locals });

  const context = new Map<string, any>([...locals, ...$context]);

  try {
    const view = await (template as Promise<Template>);
    const render = stream ? renderToStream : renderToString;
    const html = render(view, _props, { context });
    fn(null, html);
  } catch (error) {
    fn(error);
  }
}
