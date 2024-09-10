export function parse_id(id: string) {
  const [filename, query] = id.split(`?`, 2);
  const searchParams = new URLSearchParams(query);
  return { filename, query, searchParams };
}

export function is_view(id: string) {
  return id.endsWith(".svelte");
}
