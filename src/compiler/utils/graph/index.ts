import iterare from 'iterare'

function _getPath<T> (getNeighbors: (t: T) => Iterable<T>,
                      start: T,
                      end: T,
                      pathUntilNow: T[],
                      visited: Set<T>,
): { outOfOptions: true } | { outOfOptions: false, path: T[] } {
  if (start == end) {
    return {
      outOfOptions: false,
      path: [...pathUntilNow],
    }
  }
  for (const neighbor of getNeighbors(start)) {
    if (visited.has(neighbor)) continue
    const newVisited = new Set([...visited, neighbor])
    const newPathUntilNow = [...pathUntilNow, neighbor]
    const result = _getPath(getNeighbors, neighbor, end, newPathUntilNow, newVisited)
    if (!result.outOfOptions) {
      return result
    }
  }
  return {outOfOptions: true}
}

export function getPath<T> (getNeighbors: (t: T) => Iterable<T>, start: T, end: T): T[] {
  const result = _getPath(getNeighbors, start, end, [start], new Set([start]))
  if (result.outOfOptions) {
    throw new Error(`Cannot find path from ${start} to ${end}.`)
  }
  return result.path
}

export function printTreePath<T> (isHopToParent: (from: T, to: T) => boolean,
                                  printHopToParent: (from: T, to: T) => string,
                                  printHopToChild: (from: T, to: T) => string,
                                  path: T[]): string {
  if (path.length == 1) {
    return ''
  }

  const result: string[] = []

  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i]
    const to = path[i + 1]
    if (isHopToParent(from, to)) {
      result.push(printHopToParent(from, to))
    } else {
      result.push(printHopToChild(from, to))
    }
  }

  return '.' + result.join('.')
}
