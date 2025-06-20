import { Node } from "estree-walker";
import { AST } from "svelte/compiler";

export function visit(
  node: Node,
  visitor: (node: AST.BaseNode) => AST.BaseNode
): AST.BaseNode {
  if ("children" in node) {
    node.children = (node.children as Node[]).map((_) => visit(_, visitor));
  }

  return visitor(node as AST.BaseNode);
}
