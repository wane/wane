import { TemplateNodeValue } from '../../template-nodes/nodes/template-node-value-base'
import { Forest, TreeNode } from '../../utils/tree'
import { isInstance } from '../../utils/utils'
import { isWrappedIn } from './html'
import { TemplateNodeTextValue } from "../../template-nodes/nodes/text-node";

function _removeWhitespaceNodes (nodes: Iterable<TreeNode<TemplateNodeValue>>): Iterable<TreeNode<TemplateNodeValue>> {
  const result: Array<TreeNode<TemplateNodeValue>> = []
  for (const node of nodes) {
    if (node.hasChildren()) {
      const processedChildren = _removeWhitespaceNodes(node.getChildren())
      const processedNode = new TreeNode(node.getValueOrThrow(), [...processedChildren])
      result.push(processedNode)
    } else {
      const value = node.getValueOrThrow()
      if (isInstance(TemplateNodeTextValue)(value)) {
        const binding = value.getBinding()
        const isConstant = binding.boundValue.isConstant()
        if (isConstant) {
          const resolved = value.getBinding().boundValue.resolve()
          if (isWrappedIn([`'`, `'`])(resolved)) {
            const withoutQuotes = resolved.slice(1, -1)
            const deserialized = withoutQuotes.replace(/\\n/g, '\n')
            const trimmed = deserialized.trim()
            if (trimmed == '') {
              continue
            }
          }
        }
      }
      result.push(new TreeNode(value))
    }
  }
  return result
}

export function removeWhitespaceNodes (forest: Forest<TemplateNodeValue>): Forest<TemplateNodeValue> {
  const roots = forest.getRoots()
  const processed = _removeWhitespaceNodes(roots)
  return new Forest(processed)
}
