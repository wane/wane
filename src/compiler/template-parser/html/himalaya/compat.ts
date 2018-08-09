/*
  We don't want to include babel-polyfill in our project.
    - Library authors should be using babel-runtime for non-global polyfilling
    - Adding babel-polyfill/-runtime increases bundle size significantly

  We will include our polyfill instance methods as regular functions.
*/

export function startsWith (str: string, searchString: string, position: number = 0): boolean {
  return str.substr(position, searchString.length) === searchString
}

export function endsWith (str: string, searchString: string, position: number = str.length): boolean {
  const index = (position || str.length) - searchString.length
  const lastIndex = str.lastIndexOf(searchString, index)
  return lastIndex !== -1 && lastIndex === index
}

export function stringIncludes (str: string, searchString: string, position: number = 0): boolean {
  return str.indexOf(searchString, position) !== -1
}

export function isRealNaN (x: any): x is number {
  return typeof x === 'number' && isNaN(x)
}

export function arrayIncludes<T> (array: Array<T>, searchElement: T, position: number = 0): boolean {
  const len = array.length
  if (len === 0) return false

  const lookupIndex = position
  const isNaNElement = isRealNaN(searchElement)
  let searchIndex = lookupIndex >= 0 ? lookupIndex : len + lookupIndex
  while (searchIndex < len) {
    const element = array[searchIndex++]
    if (element === searchElement) return true
    if (isNaNElement && isRealNaN(element)) return true
  }

  return false
}
