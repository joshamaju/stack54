export function parse_id(id: string) {
  const [filename, query] = id.split(`?`, 2);
  const searchParams = new URLSearchParams(query);
  return { filename, query, searchParams };
}

export function parse_request(id: string) {
  const { searchParams, ...res } = parse_id(id);

  let ssr = true;

  if (searchParams.has("ssr")) {
    let param = searchParams.get("ssr");

    if (param?.trim() == "") {
      ssr = true;
    } else {
      ssr = false;
    }
  }

  return { ...res, searchParams, ssr };
}

export function is_view(id: string) {
  return id.endsWith(".svelte") || id.endsWith(".svx");
}
