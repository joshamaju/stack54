import { Integration } from "../config";

export async function resolve(integration: Integration | Promise<Integration>) {
  return integration instanceof Promise ? await integration : integration;
}
