export type Type = 'string' | 'number' | 'boolean' | 'undefined' | 'function'

export type TypeToName<T> =
  T extends string ? 'string' :
    T extends number ? 'number' :
      T extends boolean ? 'boolean' :
        T extends undefined ? 'undefined' :
          T extends Function ? 'function' :
            'object';

export type NameToType<T extends Type> =
  T extends 'string' ? string :
    T extends 'number' ? number :
      T extends 'boolean' ? boolean :
        T extends 'undefined' ? undefined :
          T extends 'function' ? Function : object

export type Guard<T> = (arg: any) => arg is T
export type UnaryPredicate<T> = (arg: T) => boolean
export type Predicate = (...args: any[]) => boolean

export function isInstance<T> (ctor: new (...args: any[]) => T): (x: any) => x is T {
  return (x => x instanceof ctor) as (x: any) => x is T
}

export function isType<T extends Type> (type: T): (x: any) => x is NameToType<T> {
  return (x => (typeof x as Type) == type) as (x: any) => x is NameToType<T>
}

export function transposeMapOfSets (transposeMapKeys: Set<string>, originalMap: Map<string, Set<string>>): Map<string, Set<string>> {
  const transposeMap = new Map<string, Set<string>>()
  transposeMapKeys.forEach(transposeMapKey => {
    const transposeMapValue = new Set<string>()
    const setOfOriginalMapKeysWhereThisTransposeMapKeyBelongs = new Set<string>()
    originalMap.forEach((originalMapValue, originalMapKey) => {
      if (originalMapValue.has(transposeMapKey)) {
        transposeMapValue.add(originalMapKey)
      }
    })
    transposeMap.set(transposeMapKey, transposeMapValue)
  })
  return transposeMap
}

export function createOrAddToSet<T> (item: T, set: Set<T> | undefined | null): Set<T> {
  if (set == null) {
    return new Set([item])
  } else {
    set.add(item)
    return set
  }
}

export function getIntersection<T> (it1: Iterable<T>, it2: Iterable<T>): Iterable<T> {
  const arr1 = [...it1]
  const arr2 = [...it2]
  const result = new Set<T>()
  for (const item1 of arr1) {
    for (const item2 of arr2) {
      if (item1 == item2) {
        result.add(item1)
      }
    }
  }
  return result
}

export function log<T> (arg: T, ...args: any[]): T {
  console.log(arg, ...args)
  return arg
}

export function has<T> (set: Set<T>, predicate: (item: T) => boolean): boolean {
  for (const item of set) {
    if (predicate(item)) {
      return true
    }
  }
  return false
}
