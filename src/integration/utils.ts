import {TemplateNodeValue} from '../compiler/template-nodes/nodes/template-node-value-base'
import {TreeNode} from '../compiler/utils/tree'
import {TemplateNodeInterpolationValue} from '../compiler/template-nodes'

export function assertIsInterpolationAndHasNoChildren(treeNode: TreeNode<TemplateNodeValue>): treeNode is TreeNode<TemplateNodeInterpolationValue> {
  it(`is interpolation`, () => {
    expect(treeNode.getValueOrThrow() instanceof TemplateNodeInterpolationValue).toBe(true)
  })
  it(`has no children`, () => {
  expect(treeNode.hasChildren()).toBe(false)
  })
  return true
}
