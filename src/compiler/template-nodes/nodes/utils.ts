import { TreeNode } from '../../utils/tree'
import { TemplateNodeComponentValue } from './component-node'
import { Guard, log, Predicate, UnaryPredicate } from '../../utils/utils'
import { TemplateNodeInterpolationValue } from './interpolation-node'
import { TemplateNodeConditionalViewValue } from './conditional-view-node'

export function and<A> (a: Guard<A>): Guard<A>
export function and<A, B> (a: Guard<A>, b: Guard<B>): Guard<A & B>
export function and<A, B, C> (a: Guard<A>, b: Guard<B>, c: Guard<C>): Guard<A & B & C>
export function and<A, F extends Predicate> (a: Guard<A>, ...fns: UnaryPredicate<A>[]): Guard<A>
export function and (...fns: Predicate[]): Predicate
export function and (...fns: Predicate[]) {
  return function (...args: any[]) {
    for (const fn of fns) {
      if (!fn(...args)) return false
    }
    return true
  }
}

export function or<A> (a: Guard<A>): Guard<A>
export function or<A, B> (a: Guard<A>, b: Guard<B>): Guard<A | B>
export function or<A, B, C> (a: Guard<A>, b: Guard<B>, c: Guard<C>): Guard<A | B | C>
export function or<A, B, C, D> (a: Guard<A>, b: Guard<B>, c: Guard<C>, d: Guard<D>): Guard<A | B | C | D>
export function or (...fns: Predicate[]) {
  return function (...args: any[]) {
    for (const fn of fns) {
      if (fn(...args)) return true
    }
    return false
  }
}

export function isTreeNodeValueTypeOf<T> (ctor: new (...args: any[]) => T): (treeNode: TreeNode<any>) => treeNode is TreeNode<T> {
  return function (treeNode: TreeNode<any>): treeNode is TreeNode<T> {
    return treeNode.getValueOrThrow() instanceof ctor
  }
}

export function isStringSameWhenTrimmed (first: string) {
  return function (second: string) {
    return first.trim() == second.trim()
  }
}

export const isCmpNode: Guard<TreeNode<TemplateNodeComponentValue>> = isTreeNodeValueTypeOf(TemplateNodeComponentValue)
export const isTextNode: Guard<TreeNode<TemplateNodeInterpolationValue>> = isTreeNodeValueTypeOf(TemplateNodeInterpolationValue)

export function isCmpNodeWithName (tagName: string): Guard<TreeNode<TemplateNodeComponentValue>> {
  return and(
    isTreeNodeValueTypeOf(TemplateNodeComponentValue),
    node => node.getValueOrThrow().getTagName() == tagName,
  )
}

export function isConditionalViewNodeWithVar (path: string): Guard<TreeNode<TemplateNodeConditionalViewValue>> {
  return and(
    isTreeNodeValueTypeOf(TemplateNodeConditionalViewValue),
    node => node.getValueOrThrow().getRawCondition() == path,
  )
}

export function isInterpolationNodeWithProp (propAccessorPath: string): Guard<TreeNode<TemplateNodeInterpolationValue>> {
  return and(
    isTreeNodeValueTypeOf(TemplateNodeInterpolationValue),
    node => !node.getValueOrThrow().getBinding().boundValue.isConstant(),
    node => node.getValueOrThrow().rawContent() == propAccessorPath,
  )
}

export function isTextNodeWithContent (textContent: string): Guard<TreeNode<TemplateNodeInterpolationValue>> {
  return and(
    isTreeNodeValueTypeOf(TemplateNodeInterpolationValue),
    node => node.getValueOrThrow().getBinding().boundValue.isConstant(),
    node => isStringSameWhenTrimmed(node.getValueOrThrow().rawContent())(textContent),
  )
}
