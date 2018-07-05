import {encapsulate} from './css'

export default function (uniqueId: number, tagName: string, inputString: string): string {
  return encapsulate(uniqueId, tagName, inputString)
}
