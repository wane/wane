export interface Eps extends Object {
  type: 'eps',
}

export function isEps (x: unknown): x is Eps {
  return typeof x == 'object' && x != null && 'type' in x && (x as any).type == 'eps'
}

export const eps: Eps = {
  type: 'eps',
  toString() {
    return `ε`
  }
}