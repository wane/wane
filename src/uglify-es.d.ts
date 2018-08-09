// import { Plugin } from "rollup";

declare module 'uglify-es' {

  function minify (...args: any[]): any

}

declare module 'brotli-size' {
  function sync (s: string): any
}

declare module 'cli-table' {
  const val: (options?: any) => void
  export = val
}

declare module 'rollup-plugin-uglify' {
  const val: (options?: any) => Plugin
  export = val
}

declare module 'css-tree' {
  const val: any
  export = val
}

declare module 'is-travis' {
  const val: boolean
  export = val
}

declare module 'lite-server' {
  const val: any
  export = val
}
