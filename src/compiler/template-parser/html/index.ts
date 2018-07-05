import {TemplateNodeValue} from '../../template-nodes/nodes/template-node-value-base'
import {Forest} from '../../utils/tree'
import {removeWhitespaceNodes} from './html-post'
import {parseTemplate} from './html'

export default function (input: string): Forest<TemplateNodeValue> {
  return removeWhitespaceNodes(parseTemplate(input))
}
