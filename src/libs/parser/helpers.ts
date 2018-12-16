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

export function areArraysEqualInAnyOrder<T> (arr1: Array<T>, arr2: Array<T>, isEq: (item1: T, item2: T) => boolean = (a, b) => a === b): boolean {
  if (arr1.length != arr2.length) return false

  const matchedIndexesFromArr2: number[] = []

  outer: for (let i = 0; i < arr1.length; i++) {
    inner: for (let j = 0; j < arr2.length; j++) {
      if (matchedIndexesFromArr2.includes(j)) continue inner

      const item1 = arr1[i]
      const item2 = arr2[j]

      if (isEq(item1, item2)) {
        matchedIndexesFromArr2.push(j)
        continue outer
      }
    }
    return false
  }

  return true
}
