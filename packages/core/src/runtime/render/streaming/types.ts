/** One completed deferred boundary waiting to be serialized to the response. */
export type Chunk = {
  name?: string;
  value?: unknown;
  content: string;
  id: string | number;
};
