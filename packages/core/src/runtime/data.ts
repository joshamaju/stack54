import { parse, stringify } from "devalue";

const _decode = (data: string) => parse(data);
const _encode = (data: object) => stringify(data);

/** Serialize data into a script element without allowing strings to close it early. */
export function encode(data: object, { id }: { id?: string }) {
  const safeId = id?.replace(/[&"<>']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      '"': "&quot;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
    };
    return entities[char];
  });
  const serialized = _encode(data).replace(/</g, "\\u003C");
  return `<script${safeId === undefined ? "" : ` id="${safeId}"`} type="application/json">${serialized}</script>`;
}

export function decode<T = object>(id: string): T | null {
  const element = document.getElementById(id);
  const content = element?.textContent;
  return content ? _decode(content) : null;
}

export { _encode as stringify, _decode as parse };
