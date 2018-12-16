export const light = Symbol('light')
export const heavy = Symbol('heavy')
export const scoot = Symbol('scoot')
type Descriptor = typeof light | typeof heavy | typeof scoot

const Up = Symbol('Up')
const Down = Symbol('Down')
const Left = Symbol('Left')
const Right = Symbol('Right')
type Direction = typeof Up | typeof Down | typeof Left | typeof Right

interface Side {
  direction: Direction
  descriptor: Descriptor
}

function createSide (direction: Direction) {
  return function (descriptor: Descriptor): Side {
    return {direction, descriptor}
  }
}

export const up = createSide(Up)
export const down = createSide(Down)
export const left = createSide(Left)
export const right = createSide(Right)

const characterMap: Record<Descriptor, Record<Descriptor, Record<Descriptor, Record<Descriptor, string>>>> = {
  [light]: { // Up
    [light]: { // Down
      [light]: { // Left
        [light]: '┼', // Right
        [heavy]: '┾', // Right
        [scoot]: '┤', // Right
      },
      [heavy]: { // Left
        [light]: '┽', // Right
        [heavy]: '┿', // Right
        [scoot]: '┥', // Right
      },
      [scoot]: { // Left
        [light]: '├', // Right
        [heavy]: '┝', // Right
        [scoot]: '│', // Right
      },
    },
    [heavy]: { // Down
      [light]: { // Left
        [light]: '╁', // Right
        [heavy]: '╆', // Right
        [scoot]: '┧', // Right
      },
      [heavy]: { // Left
        [light]: '╅', // Right
        [heavy]: '╈', // Right
        [scoot]: '┪', // Right
      },
      [scoot]: { // Left
        [light]: '┟', // Right
        [heavy]: '┢', // Right
        [scoot]: '╽', // Right
      },
    },
    [scoot]: { // Down
      [light]: { // Left
        [light]: '┴', // Right
        [heavy]: '┶', // Right
        [scoot]: '┘', // Right
      },
      [heavy]: { // Left
        [light]: '┵', // Right
        [heavy]: '┷', // Right
        [scoot]: '┙', // Right
      },
      [scoot]: { // Left
        [light]: '└', // Right
        [heavy]: '┕', // Right
        [scoot]: '╵', // Right
      },
    },
  },
  [heavy]: { // Up
    [light]: { // Down
      [light]: { // Left
        [light]: '╀', // Right
        [heavy]: '╄', // Right
        [scoot]: '┦', // Right
      },
      [heavy]: {
        [light]: '╃',
        [heavy]: '╇',
        [scoot]: '┩',
      },
      [scoot]: {
        [light]: '┞',
        [heavy]: '┡',
        [scoot]: '╿',
      },
    },
    [heavy]: {
      [light]: {
        [light]: '╂',
        [heavy]: '╊',
        [scoot]: '┨',
      },
      [heavy]: {
        [light]: '╉',
        [heavy]: '╋',
        [scoot]: '┫',
      },
      [scoot]: {
        [light]: '┠',
        [heavy]: '┣',
        [scoot]: '┃',
      },
    },
    [scoot]: {
      [light]: {
        [light]: '┸',
        [heavy]: '┺',
        [scoot]: '┚',
      },
      [heavy]: {
        [light]: '┹',
        [heavy]: '┻',
        [scoot]: '┛',
      },
      [scoot]: {
        [light]: '┖',
        [heavy]: '┗',
        [scoot]: '╹',
      },
    },
  },
  [scoot]: {
    [light]: {
      [light]: {
        [light]: '┬',
        [heavy]: '┮',
        [scoot]: '┐',
      },
      [heavy]: {
        [light]: '┭',
        [heavy]: '┯',
        [scoot]: '┑',
      },
      [scoot]: {
        [light]: '┌',
        [heavy]: '┍',
        [scoot]: '╷',
      },
    },
    [heavy]: {
      [light]: {
        [light]: '┰',
        [heavy]: '┲',
        [scoot]: '┒',
      },
      [heavy]: {
        [light]: '┱',
        [heavy]: '┳',
        [scoot]: '┓',
      },
      [scoot]: {
        [light]: '┎',
        [heavy]: '┏',
        [scoot]: '╻',
      },
    },
    [scoot]: {
      [light]: {
        [light]: '─',
        [heavy]: '╼',
        [scoot]: '╴',
      },
      [heavy]: {
        [light]: '╾',
        [heavy]: '━',
        [scoot]: '╸',
      },
      [scoot]: {
        [light]: '╶',
        [heavy]: '╺',
        [scoot]: ' ',
      },
    },
  },
}

export function char (fallback: Descriptor, ...sides: Array<Side>): string
export function char (...sides: Array<Side>): string
export function char (): string {
  const args = Array.from(arguments)
  const fallback: Descriptor = typeof args[0] == 'symbol' ? args[0] : light
  const sides: Array<Side> = typeof args[0] == 'symbol' ? args.slice(1) : args
  const wrappedFallback = {descriptor: fallback}

  const upSide = (sides.find(side => side.direction == Up) || wrappedFallback).descriptor
  const downSide = (sides.find(side => side.direction == Down) || wrappedFallback).descriptor
  const leftSide = (sides.find(side => side.direction == Left) || wrappedFallback).descriptor
  const rightSide = (sides.find(side => side.direction == Right) || wrappedFallback).descriptor

  return (characterMap as any)[upSide]![downSide]![leftSide]![rightSide]!
}
