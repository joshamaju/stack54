export function parse_id(id: string) {
  /** Vite appends query flags to module IDs; keep the filesystem path separate
   * for matching while returning parsed query details to callers.
   */
  const [filename, query] = id.split(`?`, 2);
  const searchParams = new URLSearchParams(query);
  return { filename, query, searchParams };
}
