type AstNode = Record<string, unknown> & { type: string };

type Visitor = {
  enter?(node: AstNode): void;
  leave?(node: AstNode): void;
};

/** Walk Svelte's legacy template AST without relying on compiler.walk, which is
 * deprecated and throws in Svelte 5. Legacy template nodes are not standard
 * ESTree nodes, so recurse through their object properties instead.
 */
export function walk_ast(root: unknown, visitor: Visitor): void {
  const seen = new WeakSet<object>();

  function visit(value: unknown): void {
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }

    if (value === null || typeof value !== "object") return;
    if (seen.has(value)) return;
    seen.add(value);

    const node = value as AstNode;
    const is_node = typeof node.type === "string";
    if (is_node) visitor.enter?.(node);

    for (const [key, child] of Object.entries(node)) {
      if (key === "loc" || key === "parent" || key === "tokens") continue;
      visit(child);
    }

    if (is_node) visitor.leave?.(node);
  }

  visit(root);
}
