export type MaybePromise<T> = T | Promise<T>;

export function isThenable<T>(value: unknown): value is Promise<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof (value as { then: unknown }).then === "function"
  );
}

export function awaitMaybe<T>(value: MaybePromise<T>): Promise<T> {
  return isThenable<T>(value) ? value : Promise.resolve(value);
}
