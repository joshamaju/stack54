import type { Integration } from "../config";

/** Resolve an integration value, including thenables from other realms. */
export async function resolve(
  integration: Integration | PromiseLike<Integration>,
) {
  return await integration;
}
