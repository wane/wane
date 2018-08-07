import { encapsulate, replaceTagNames } from './css'
import { scssToCss } from './scss-to-css'

export default function (uniqueId: number,
                         hostTagName: string,
                         resolveTagName: (selector: string) => string,
                         scss: string,
                         rootSrcFolder: string): string {
  const css = scssToCss(scss, rootSrcFolder)
  const encapsulated = encapsulate(uniqueId, hostTagName, css)
  const replacedTagNames = replaceTagNames(resolveTagName, encapsulated)
  return replacedTagNames
}
