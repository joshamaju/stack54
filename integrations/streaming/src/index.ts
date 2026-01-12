import { decode } from "stack54/data";

export function hydrate<T>(name: string) {
  return decode<T>(`deferred:${name}`);
}

export function defer<T>(name: string, promise: Promise<T>): Promise<T>;
export function defer<T>(name: string, promise: PromiseLike<T>): PromiseLike<T>;
export function defer<T>(name: string, promise: Promise<T> | PromiseLike<T>) {
  Object.defineProperty(promise, "$$deferred", {
    value: name,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  return promise;
}
