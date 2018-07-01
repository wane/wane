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
