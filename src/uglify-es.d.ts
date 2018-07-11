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

declare module 'property-information' {

  export interface PropInfo {
    name: string,
    propertyName: string,
    mustUseAttribute: boolean,
    mustUseProperty: boolean,
    boolean: boolean,
    overloadedBoolean: boolean,
    numeric: boolean,
    positiveNumeric: boolean,
    commaSeparated: boolean,
    spaceSeparated: boolean
  }

  interface Val {
    (name: string): PropInfo
    all: PropInfo[]
  }

  const val: Val
  export = val

}
