import * as sass from 'node-sass'
import * as path from 'path'

function tildeSrcResolver (root: string): sass.Importer {
  return (url, prev, done) => {
    const relative = url.startsWith(`~/`) ? '.' + url.slice(1) : url
    const file = path.join(root, relative)
    return { file }
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
