type Template = import("./dist/types/template").Template;

declare module "*.svelte?ssr" {
  const Component: Template;
  export default Component;
}
