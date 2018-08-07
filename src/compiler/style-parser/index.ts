import { encapsulate } from './css'
import { scssToCss } from './scss-to-css'

export default function (uniqueId: number,
                         tagName: string,
                         scss: string,
                         rootSrcFolder: string): string {
  const css = scssToCss(scss, rootSrcFolder)
  return encapsulate(uniqueId, tagName, css)
}
