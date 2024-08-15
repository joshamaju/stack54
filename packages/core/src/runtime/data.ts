import { parse, stringify } from "devalue";

export const raw_decode = (data: string) => parse(data);
export const raw_encode = (data: object) => stringify(data);

export function encode(data: object, { id }: { id?: string }) {
  return `<script id=${id} type="application/json">${stringify(data)}</script>`;
}

export function decode(id: string): object | null {
  const element = document.getElementById(id);
  const content = element?.textContent;
  return content ? parse(content) : null;
}
