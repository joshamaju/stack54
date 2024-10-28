import { parse, stringify } from "devalue";

const _decode = (data: string) => parse(data);
const _encode = (data: object) => stringify(data);

export function encode(data: object, { id }: { id?: string }) {
  return `<script id=${id} type="application/json">${_encode(data)}</script>`;
}

export function decode<T = object>(id: string): T | null {
  const element = document.getElementById(id);
  const content = element?.textContent;
  return content ? _decode(content) : null;
}

export { _encode as stringify, _decode as parse };
