type Template = import("./dist/types/template").Template;

declare module "*.svelte?ssr" {
  const Component: Template;
  export default Component;
}

declare module "*.svx?ssr" {
  const Component: Template;
  export const metadata: Record<string, string>;
  export default Component;
}

declare module "*.svx" {
  import { ComponentConstructorOptions, SvelteComponent } from "svelte";

  const Component: {
    new (options: ComponentConstructorOptions): SvelteComponent;
  };

  export default Component;
}
