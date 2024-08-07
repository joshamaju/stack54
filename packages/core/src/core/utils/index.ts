/** Wraps an object in an array. If an array is passed, ignore it. */
export function arraify<T>(target: T | T[]): T[] {
  return Array.isArray(target) ? target : [target];
}

// export function getMode() {
//   return process.env.NODE_ENV ?? "development";
// }
