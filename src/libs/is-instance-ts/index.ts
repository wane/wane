export function isInstance<T> (ctor: new (...args: any[]) => T) {
  return function (item: unknown): item is T {
    return item instanceof ctor
  }
}
