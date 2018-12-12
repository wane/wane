import { TraversalControl } from './traversal-class'
import {
  forEach,
  forEachDescendant,
  find,
  findOrThrow,
  filter,
  findDescendant,
  findDescendantOrThrow, filterDescendants,
} from './fp'
import { Guard, Predicate } from '../helper-types'
import { TreeNode } from './tree-node.interface'


export abstract class TraversableNode implements TreeNode {

  public abstract getChildren (): Array<TreeNode>

  public forEach (operation: (node: TraversableNode, traversal: TraversalControl) => void): void {
    forEach(this, operation)
  }

  public forEachDescendant (operation: (node: TraversableNode, traversal: TraversalControl) => void): void {
    forEachDescendant(this, operation)
  }

  public find<T extends TraversableNode> (guard: Guard<TraversableNode, T>): T | undefined
  public find (predicate: Predicate<TraversableNode>): TraversableNode | undefined
  public find (fn: Predicate<TraversableNode>): TraversableNode | undefined {
    return find(this, fn)
  }

  public findOrThrow<T extends TraversableNode> (guard: Guard<TraversableNode, T>): T
  public findOrThrow (predicate: Predicate<TraversableNode>): TraversableNode
  public findOrThrow (fn: Predicate<TraversableNode>): TraversableNode {
    return findOrThrow(this, fn)
  }

  public filter<T extends TraversableNode> (guard: Guard<TraversableNode, T>): Array<T>
  public filter (predicate: Predicate<TraversableNode>): Array<TraversableNode>
  public filter (fn: Predicate<TraversableNode>): Array<TraversableNode> {
    return filter(this, fn)
  }

  public findDescendant<T extends TraversableNode> (guard: Guard<TraversableNode, T>): T | undefined
  public findDescendant (predicate: Predicate<TraversableNode>): TraversableNode | undefined
  public findDescendant (fn: Predicate<TraversableNode>): TraversableNode | undefined {
    return findDescendant(this, fn)
  }

  public findDescendantOrThrow<T extends TraversableNode> (guard: Guard<TraversableNode, T>): T
  public findDescendantOrThrow (predicate: Predicate<TraversableNode>): TraversableNode
  public findDescendantOrThrow (fn: Predicate<TraversableNode>): TraversableNode {
    return findDescendantOrThrow(this, fn)
  }

  public filterDescendants<T extends TraversableNode> (guard: Guard<TraversableNode, T>): Array<T>
  public filterDescendants (predicate: Predicate<TraversableNode>): Array<TraversableNode>
  public filterDescendants (fn: Predicate<TraversableNode>): Array<TraversableNode> {
    return filterDescendants(this, fn)
  }

}
