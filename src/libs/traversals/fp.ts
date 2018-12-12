import { Traversal, TraversalControl } from './traversal-class'
import { TreeNode } from './tree-node.interface'
import { Guard, Predicate } from '../helper-types'

export function forEachDescendant<Node extends TreeNode> (
  that: Node,
  operation: (node: Node, traversalControl: TraversalControl) => void,
): Traversal {
  const traversal = new Traversal()
  for (const child of that.getChildren()) {
    traversal.reset()
    operation(child as Node, traversal.control)
    if (traversal.end) return traversal
    if (traversal.skipChildren) continue
    const innerTraversal = forEachDescendant(child as Node, operation)
    if (innerTraversal.end) return innerTraversal
  }
  traversal.reset()
  return traversal
}

export function forEach<Node extends TreeNode> (
  that: Node,
  operation: (node: Node, traversalControl: TraversalControl) => void,
) {
  const traversal = new Traversal()
  operation(that, traversal.control)
  if (traversal.end || traversal.skipChildren) return traversal
  forEachDescendant(that, operation)
}

export function find<Node extends TreeNode, T extends Node> (that: Node, guard: Guard<Node, T>): T | undefined
export function find<Node extends TreeNode> (that: Node, predicate: Predicate<Node>): Node | undefined
export function find<Node extends TreeNode> (that: Node, fn: Predicate<Node>): Node | undefined {
  let result: Node | undefined
  forEach(that, (node, {end}) => {
    if (fn(node)) {
      result = node
      end()
    }
  })
  return result
}

export function findOrThrow<Node extends TreeNode, T extends Node> (that: Node, guard: Guard<Node, T>): T
export function findOrThrow<Node extends TreeNode> (that: Node, predicate: Predicate<Node>): Node
export function findOrThrow<Node extends TreeNode> (that: Node, fn: Predicate<Node>): Node {
  const result = find(that, fn)
  if (result == null) throw new Error(`Expected to find a node.`)
  return result
}

export function filter<Node extends TreeNode, T extends Node> (that: Node, guard: Guard<Node, T>): Array<T>
export function filter<Node extends TreeNode> (that: Node, predicate: Predicate<Node>): Array<Node>
export function filter<Node extends TreeNode> (that: Node, fn: Predicate<Node>): Array<Node> {
  const result: Array<Node> = []
  forEach(that, node => {
    if (fn(node)) result.push(node)
  })
  return result
}

export function findDescendant<Node extends TreeNode, T extends Node> (that: Node, guard: Guard<Node, T>): T | undefined
export function findDescendant<Node extends TreeNode> (that: Node, predicate: Predicate<Node>): Node | undefined
export function findDescendant<Node extends TreeNode> (that: Node, fn: Predicate<Node>): Node | undefined {
  let result: Node | undefined
  forEachDescendant(that, (node, {end}) => {
    if (fn(node)) {
      result = node
      end()
    }
  })
  return result
}

export function findDescendantOrThrow<Node extends TreeNode, T extends Node> (that: Node, guard: Guard<Node, T>): T
export function findDescendantOrThrow<Node extends TreeNode> (that: Node, predicate: Predicate<Node>): Node
export function findDescendantOrThrow<Node extends TreeNode> (that: Node, fn: Predicate<Node>): Node {
  const result = findDescendant(that, fn)
  if (result == null) throw new Error(`Expected to find a node.`)
  return result
}

export function filterDescendants<Node extends TreeNode, T extends Node> (that: Node, guard: Guard<Node, T>): Array<T>
export function filterDescendants<Node extends TreeNode> (that: Node, predicate: Predicate<Node>): Array<Node>
export function filterDescendants<Node extends TreeNode> (that: Node, fn: Predicate<Node>): Array<Node> {
  const result: Array<Node> = []
  forEachDescendant(that, node => {
    if (fn(node)) result.push(node)
  })
  return result
}
