export function repeat (length: number, char: string): string {
  return ''.padStart(length, char)
}

export function spaces (length: number): string {
  return repeat(length, ' ')
}

export function trunc (max: number, string: string): string {
  if (max < string.length) return `${ string.slice(0, max - 1) }…`
  return string
}

export function centerWithTrunc (width: number, string: string): string {
  if (string.length > width) {
    return trunc(width, string)
  }
  return centerOrThrow(width, string)
}

export function centerOrThrow (width: number, string: string): string {
  if (string.length > width) throw new Error(`String too large.`)
  const padding = (width - string.length) / 2
  const [leftPad, rightPad] = (padding == Math.floor(padding))
    ? [padding, padding]
    : [padding + 0.5, padding - 0.5]
  return spaces(leftPad) + string + spaces(rightPad)
}

export function joinStringBlocks (block1: string, block2: string): string {
  const rows1 = block1.split('\n')
  const rows2 = block2.split('\n')
  return rows1.reduce<string[]>((acc, curr, index) => {
    return [
      ...acc,
      curr + rows2[index],
    ]
  }, []).join('\n')
}

export function insertBetween<T> (array: Array<T>, item: T): Array<T> {
  const result: Array<T> = []
  for (let i = 0; i < array.length; i++) {
    result.push(array[i])
    result.push(item)
  }
  result.pop()
  return result
}
