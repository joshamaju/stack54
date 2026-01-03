import getPort from "get-port";
import { readFile, writeFile } from "node:fs/promises";

export default async function port() {
  /**
   * @type {number | undefined}
   */
  let port_;

  try {
    const file = await readFile("port.txt", "utf-8");
    port_ = Number(file);
  } catch (error) {
    port_ = await getPort();
    await writeFile("port.txt", port_.toString());
  }

  return port_;
}
