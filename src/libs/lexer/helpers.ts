import { Unicode } from './unicode'

export function or (...functions: Array<(char: Character) => boolean>) {
  return function (char: Character) {
    return functions.some(fn => fn(char))
  }
}

export function and (...functions: Array<(char: Character) => boolean>) {
  return function (char: Character) {
    return functions.every(fn => fn(char))
  }
}

export function is<T extends typeof EOF | string> (theChar: T) {
  return function (char: Character): char is T {
    return char == theChar
  }
}

export function range (start: string, end: string) {
  return function (char: Character) {
    return typeof char == 'string' && start <= char && char <= end
  }
}

export function not (fn: (char: Character) => boolean) {
  return function (char: Character) {
    return !fn(char)
  }
}

export const EOF = Symbol('eof')

export const isEof = is(EOF)

export type Character = string | typeof EOF

// § 2.4.1. Common parser idioms
// http://w3c.github.io/html/infrastructure.html#common-parser-idioms

export const isSpaceCharacter = or(
  is(Unicode.Space),
  is(Unicode.CharacterTabulation),
  is(Unicode.LineFeed),
  is(Unicode.FormFeed),
  is(Unicode.CarriageReturn),
)

export const isUppercaseAsciiLetter = range(Unicode.LatinCapitalLetterA, Unicode.LatinCapitalLetterZ)

export const isLowercaseAsciiLetter = range(Unicode.LatinSmallLetterA, Unicode.LatinSmallLetterZ)

export const isAsciiLetter = or(isUppercaseAsciiLetter, isLowercaseAsciiLetter)

export const isNonZeroAsciiDigit = range(Unicode.DigitOne, Unicode.DigitNine)

export const isAsciiDigit = or(is(Unicode.DigitZero), isNonZeroAsciiDigit)

export const isAlphanumericAsciiCharacter = or(isAsciiLetter, isAsciiDigit)

export const isAsciiUpperHexDigit = or(isAsciiDigit, range(Unicode.LatinCapitalLetterA, Unicode.LatinCapitalLetterF))

export const isAsciiLowerHexDigit = or(isAsciiDigit, range(Unicode.LatinSmallLetterA, Unicode.LatinSmallLetterF))

export const isAsciiHexDigit = or(isAsciiUpperHexDigit, isAsciiLowerHexDigit)
