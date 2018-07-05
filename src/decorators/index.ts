export function Page (s?: string) {
  return function (target: any) {
    return target
  }
}

export function Register (...cmps: any[]) {
  return function (target: any) {
    return target
  }
}

export function Description (s: string) {
  return function (target: any) {
    return target
  }
}

export function Entry () {
  return function (target: any) {
    return target
  }
}

export function Style (css: string) {
  return function (target: any) {
    return target
  }
}

export function HostAttribute (name: string) {
  return function (target: any, key: string) {
    return target
  }
}

export function Template (s: string) {
  return function (target: any) {
    return target
  }
}

export namespace Template {
  export function Json (def: string) {
    return function (target: any) {
      return target
    }
  }
}

export function run (root: Function) {
}
