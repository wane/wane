export type Constructor = {new (...args: any[]): any}

export function Register (...cmps: Constructor[]) {
  return function (target: any) {
    return target
  }
}

export function Style (scss: string) {
  return function (target: any) {
    return target
  }
}

export function Template (s: string) {
  return function (target: any) {
    return target
  }
}
