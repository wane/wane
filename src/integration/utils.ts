import { TemplateNodeValue } from '../compiler/template-nodes/nodes/template-node-value-base'
import { TreeNode } from '../compiler/utils/tree'
import { TemplateNodeInterpolationValue } from '../compiler/template-nodes'
import { TemplateNodeTextValue } from "../compiler/template-nodes/nodes/text-node";

export function assertIsInterpolationAndHasNoChildren (treeNode: TreeNode<TemplateNodeValue>): treeNode is TreeNode<TemplateNodeInterpolationValue> {
  it(`is interpolation`, () => {
    expect(treeNode.getValueOrThrow() instanceof TemplateNodeInterpolationValue).toBe(true)
  })
  it(`has no children`, () => {
    expect(treeNode.hasChildren()).toBe(false)
  })
  return true
}

export function assertIsTextAndHasNoChildren (treeNode: TreeNode<TemplateNodeValue>): treeNode is TreeNode<TemplateNodeTextValue> {
  it(`is text`, () => {
    expect(treeNode.getValueOrThrow() instanceof TemplateNodeTextValue).toBe(true)
  })
  it(`has no children`, () => {
    expect(treeNode.hasChildren()).toBe(false)
  })
  return true
}

export function repeat(string: string, times: number): string {
  return Array.from({length: times}).fill(string).join('')
}
