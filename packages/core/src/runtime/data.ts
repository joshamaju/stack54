import { parse, stringify } from "devalue";

export function encode(data: object, { id }: { id?: string }) {
  return `<script id=${id} type="application/json">${stringify(data)}</script>`;
}

export function decode(id: string): object | null {
  const element = document.getElementById(id);
  const content = element?.textContent;
  return content ? parse(content) : null;
}
