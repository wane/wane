export function addAndReport<T> (set: Set<T>, ...items: Array<T>): boolean {
  let aChangeWasMade = false
  for (const item of items) {
    if (!set.has(item)) aChangeWasMade = true
    set.add(item)
  }
  return aChangeWasMade
}

export function filterIndex<T> (array: Array<T>, predicate: (t: T) => boolean): Array<number> {
  const result: Array<number> = []
  for (let index = 0; index < array.length; index++) {
    if (predicate(array[index])) {
      result.push(index)
    }
  }
  return result
}

export function indexesOf<T> (haystack: Array<T>, needle: T): Array<number> {
  return filterIndex(haystack, item => item === needle)
}
