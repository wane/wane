export interface Eof extends Object {
  type: 'eof',
}

export function isEof (x: unknown): x is Eof {
  return typeof x == 'object' && x != null && 'type' in x && (x as any).type == 'eof'
}

export const eof: Eof = {
  type: 'eof',
  toString() {
    return `$`
  }
}