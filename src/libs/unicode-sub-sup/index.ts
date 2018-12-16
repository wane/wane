const sups = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
}

const subs = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
}

function subMap (character: string): string { return (subs as any)[character]! }

function supMap (character: string): string { return (sups as any)[character]! }

function mapChar (mapper: (char: string) => string) {
  return function (input: string | number) {
    return input.toString().split('').map(mapper)
  }
}

export const sub = mapChar(subMap)
export const sup = mapChar(supMap)
