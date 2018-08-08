import * as sass from 'node-sass'
import * as path from 'path'

function tildeSrcResolver (root: string): sass.Importer {
  return function (url, prev, done) {
    if (url.startsWith('~/')) {
      const relative = '.' + url.slice(1)
      const file = path.join(root, relative)
      return { file }
    }
    return null
  }
}

export function scssToCss (css: string, rootSrcFolder: string): string {
  const result = sass.renderSync({
    data: css,
    includePaths: [rootSrcFolder],
    importer: tildeSrcResolver(rootSrcFolder),
  })
  return result.css.toString('utf-8')
}
