import * as himalaya from 'himalaya'
import { Forest } from '../../utils/tree'
import { handleNodeRecursively, ParseError } from './html'
import { TemplateNodeValue } from '../../template-nodes/nodes/template-node-value-base'

export default function parseTemplate (html: string): Forest<TemplateNodeValue> {
  try {
    const roots = himalaya.parse(html, { ...himalaya.parseDefaults, includePositions: true })
      .map(handleNodeRecursively)
      .reduce((acc, curr) => [...acc, ...curr], [])
    return new Forest(roots)
  } catch (e) {
    if (e instanceof ParseError) {
      console.error(e.toString())
    }
    throw e
  }
}
