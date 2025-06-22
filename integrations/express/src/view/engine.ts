import type { Template } from "stack54";
import { makeLocals } from "stack54/locals";
import { renderToString, renderToStream, is_template } from "stack54/render";

// Add {string} to maintain type compatibility with express engine parameter types
// But we should get back only a {Template} or {Promise<Template>} from the View constructor
export async function engine(
  str: string | Template | Promise<Template>,
  options: object,
  fn: (e: any, rendered?: any) => void
) {
  let template = is_template(str) ? Promise.resolve(str) : str;

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
    const view = typeof template == "string" ? template : await template;
    const render = stream ? renderToStream : renderToString;
    const html = render(view as Template, { context, props: _props });
    fn(null, html);
  } catch (error) {
    fn(error);
  }
}
