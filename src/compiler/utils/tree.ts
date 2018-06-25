export class TreeNode<V> {

  public clone (): TreeNode<V> {
    const clone = new TreeNode(this._value)
    clone.appendChildren(this._children.map(child => child.clone()))
    return clone
  }

  private _value: V | undefined
  private _parent: TreeNode<V> | null = null
  private _children: TreeNode<V>[]
  private _nextSibling: TreeNode<V> | null = null
  private _prevSibling: TreeNode<V> | null = null

  public getValue (): V | undefined {
    return this._value
  }

  public getValueOrThrow (): V {
    if (this._value === undefined) {
      throw new Error(`No value on the node.`)
    }
    return this._value
  }

  public setValue (value: V): this {
    this._value = value
    return this
  }

  public getParentOrUndefined (): TreeNode<V> | null {
    return this._parent
  }

  public getParent (): TreeNode<V> {
    if (this._parent == null) {
      throw new Error(`Expected TreeNode to have a parent.`)
    }
    return this._parent
  }

  private setParent (parent: TreeNode<V>): this {
    if (this._parent != null) {
      throw new Error(`Attempting to forcibly change node's parent. Use TreeNode#removeChild instead.`)
    }
    this._parent = parent
    return this
  }

  public getChildren (): TreeNode<V>[] {
    return this._children
  }

  public getChildrenCount (): number {
    return this._children.length
  }

  public hasChildren (): boolean {
    return this.getChildrenCount() > 0
  }

  public getDescendants (): Iterable<TreeNode<V>> {
    const children = this._children
    return {
      * [Symbol.iterator] () {
        const queue = Array.from(children)
        while (queue.length > 0) {
          const current = queue.shift()!
          yield current
          queue.push(...current._children)
        }
      },
    }
  }

  public getDescendantsAndSelf (): Iterable<TreeNode<V>> {
    const that = this
    return {
      * [Symbol.iterator] () {
        yield that
        yield* that.getDescendants()
      },
    }
  }

  public appendChild (newChild: TreeNode<V>): this {
    if (newChild._parent != null) {
      throw new Error(`Attempted to append a child which already has a parent.`)
    }
    const currLast = this.getLastChild()
    this._children.push(newChild)
    newChild.setParent(this)
    if (currLast != null) {
      // If there is at least one child
      currLast._nextSibling = newChild
      newChild._prevSibling = currLast
      newChild._nextSibling = null
    }
    return this
  }

  public appendChildren (newChildren: TreeNode<V>[]): this {
    newChildren.forEach(newChild => {
      this.appendChild(newChild)
    })
    return this
  }

  public detachFromParent (): this {
    if (this._parent == null) {
      return this
    }
    const parent = this._parent
    parent._children = []
    this._parent = null
    return this
  }

  public getNthChild (n: number): TreeNode<V> | null {
    if (this._children.length == 0) {
      return null
    }
    return this._children[n]
  }

  public getFirstChild (): TreeNode<V> | null {
    return this.getNthChild(0)
  }

  public getLastChild (): TreeNode<V> | null {
    return this.getNthChild(this.getChildrenCount() - 1)
  }

  public getAncestorChain (): TreeNode<V>[] {
    let currentNode = this._parent
    const chain: TreeNode<any>[] = []
    while (currentNode != null) {
      chain.push(currentNode)
      currentNode = currentNode._parent
    }
    return chain
  }

  public hasAncestor (predicate: (node: TreeNode<any>) => boolean): boolean {
    return this.getAncestorChain().some(predicate)
  }

  public hasAncestorNode (node: TreeNode<any>): boolean {
    return this.hasAncestor(n => n === node)
  }

  public getNextSibling (): TreeNode<V> | null {
    return this._nextSibling
  }

  public getPrevSibling (): TreeNode<V> | null {
    return this._prevSibling
  }

  public getSiblingAfter (hopsCount: number): TreeNode<V> | null {
    if (hopsCount < 1) {
      throw new Error(`Siblings after parameter has to be 1 or greater.`)
    }
    return hopsCount == 1 ? this.getNextSibling() : this.getSiblingAfter(hopsCount - 1)
  }

  public forEach (callback: (node: TreeNode<V>) => void): void {
    callback(this)
    this.getChildren().forEach(callback)
  }

  private _printLeftPostfix (print: (value: V) => string = v => `${v}`): string {
    const string = `${print(this.getValueOrThrow())}`
    const childrenString = this.getChildren().map(child => child._printLeftPostfix(print)).join(' ')
    if (childrenString == '') return string
    return `(${childrenString}) ${string}`
  }

  public printLeftPostfix (print: (value: V) => string = v => `${v}`): string {
    return `(${this._printLeftPostfix(print)})`
  }

  private _printLeftPrefix (print: (value: V) => string = v => `${v}`): string {
    const string = `${print(this.getValueOrThrow())}`
    const childrenString = this.getChildren().map(child => child._printLeftPrefix(print)).join(' ')
    if (childrenString == '') return string
    return `${string} (${childrenString})`
  }

  public printLeftPrefix (print: (value: V) => string = v => `${v}`): string {
    return `(${this._printLeftPrefix(print)})`
  }

  public printIndented (print: (value: V) => string = v => `${v}`, by: number = 2, currLevel: number = 0) {
    const value = `${fill(by * currLevel)}${print(this.getValueOrThrow())}`
    const childrenString: string = this.getChildren()
      .map(child => child.printIndented(print, by, currLevel + 1))
      .join('\n')
    if (childrenString == '') return value
    return `${value}\n${childrenString}`
  }

  public findInDescendants<R extends V> (predicate: (node: TreeNode<V>) => node is TreeNode<R>): TreeNode<R> | null
  public findInDescendants (predicate: (node: TreeNode<V>) => boolean): TreeNode<V> | null
  public findInDescendants (predicate: (node: TreeNode<V>) => boolean): TreeNode<V> | null {
    return TreeNode.findIn(this.getDescendants())(predicate)
  }

  public findInDescendantsOrFail<R extends V> (predicate: (node: TreeNode<V>) => node is TreeNode<R>): TreeNode<R>
  public findInDescendantsOrFail (predicate: (node: TreeNode<V>) => boolean): TreeNode<V>
  public findInDescendantsOrFail (predicate: (node: TreeNode<V>) => boolean): TreeNode<V> {
    return TreeNode.findInOrFail(this.getDescendants())(predicate)
  }

  public findInDescendantsAndSelf<R extends V> (predicate: (node: TreeNode<V>) => node is TreeNode<R>): TreeNode<R> | null
  public findInDescendantsAndSelf (predicate: (node: TreeNode<V>) => boolean): TreeNode<V> | null
  public findInDescendantsAndSelf (predicate: (node: TreeNode<V>) => boolean): TreeNode<V> | null {
    return TreeNode.findIn(this.getDescendantsAndSelf())(predicate)
  }

  public findInDescendantsAndSelfOrFail<R extends V> (predicate: (node: TreeNode<V>) => node is TreeNode<R>): TreeNode<R>
  public findInDescendantsAndSelfOrFail (predicate: (node: TreeNode<V>) => boolean): TreeNode<V>
  public findInDescendantsAndSelfOrFail (predicate: (node: TreeNode<V>) => boolean): TreeNode<V> {
    return TreeNode.findInOrFail(this.getDescendantsAndSelf())(predicate)
  }

  public findValueInDescendants<R extends V> (predicate: (value: V) => value is R): TreeNode<R> | null
  public findValueInDescendants (predicate: (value: V) => boolean): TreeNode<V> | null
  public findValueInDescendants (predicate: (value: V) => boolean) {
    return this.findInDescendants(isTreeNodeValue(predicate))
  }

  public findValueInDescendantsOrFail<R extends V> (predicate: (value: V) => value is R): TreeNode<R>
  public findValueInDescendantsOrFail (predicate: (value: V) => boolean): TreeNode<V>
  public findValueInDescendantsOrFail (predicate: (valie: V) => boolean) {
    return this.findInDescendantsOrFail(isTreeNodeValue(predicate))
  }

  public findValueInDescendantsAndSelf<R extends V> (predicate: (value: V) => value is R): TreeNode<R> | null
  public findValueInDescendantsAndSelf (predicate: (value: V) => boolean): TreeNode<V> | null
  public findValueInDescendantsAndSelf (predicate: (value: V) => boolean) {
    return this.findInDescendantsAndSelf(isTreeNodeValue(predicate))
  }

  public findValueInDescendantsAndSelfOrFail<R extends V> (predicate: (value: V) => value is R): TreeNode<R>
  public findValueInDescendantsAndSelfOrFail (predicate: (value: V) => boolean): TreeNode<V>
  public findValueInDescendantsAndSelfOrFail (predicate: (valie: V) => boolean) {
    return this.findInDescendantsAndSelfOrFail(isTreeNodeValue(predicate))
  }

  public get [Symbol.toStringTag] () {
    return `TreeNode`
  }

  public toString (): string {
    const value = this.getValue()
    if (value === undefined) {
      return `[TreeNode <empty>]`
    } else {
      return `[TreeNode ${value.toString()}]`
    }
  }

  constructor (value?: V, children?: TreeNode<V>[]) {
    this._value = value
    this._children = []
    if (children != null) {
      this.appendChildren(children)
    }
  }

  public static fromPojo (
    pojo: TreeNodePojo<any>,
    transformValue: (val: any) => any = v => v,
  ): TreeNode<any> {
    const node = new TreeNode<any>(transformValue(pojo.value))
    if (pojo.children == null || pojo.children.length == 0) return node
    for (const pojoChild of pojo.children) {
      node.appendChild(TreeNode.fromPojo(pojoChild, transformValue))
    }
    return node
  }

  public static findIn<V> (haystack: Iterable<TreeNode<V>>): (predicate: (node: TreeNode<V>) => boolean) => TreeNode<V> | null
  public static findIn<V, R extends V> (haystack: Iterable<TreeNode<V>>): (predicate: (node: TreeNode<V>) => node is TreeNode<R>) => TreeNode<R> | null
  public static findIn<V> (haystack: Iterable<TreeNode<V>>): (predicate: (node: TreeNode<V>) => boolean) => TreeNode<V> | null {
    return (predicate: (node: TreeNode<V>) => boolean): TreeNode<V> | null => {
      for (const descendant of haystack) {
        if (predicate(descendant)) {
          return descendant
        }
      }
      return null
    }
  }

  public static findInOrFail<V> (haystack: Iterable<TreeNode<V>>): (predicate: (node: TreeNode<V>) => boolean) => TreeNode<V>
  public static findInOrFail<V, R extends V> (haystack: Iterable<TreeNode<V>>): (predicate: (node: TreeNode<V>) => node is TreeNode<R>) => TreeNode<R>
  public static findInOrFail<V> (haystack: Iterable<TreeNode<V>>): (predicate: (node: TreeNode<V>) => boolean) => TreeNode<V> {
    return (predicate: (node: TreeNode<V>) => boolean): TreeNode<V> => {
      const result = TreeNode.findIn(haystack)(predicate)
      if (result != null) {
        return result
      }
      throw new Error(`Could not find anything in the given haystack.`)
    }
  }

}

export function isTreeNodeValue<T> (predicate: (value: T) => boolean): (treeNode: TreeNode<T>) => boolean
export function isTreeNodeValue<T, R extends T> (predicate: (value: T) => value is R): (treeNode: TreeNode<T>) => treeNode is TreeNode<R>
export function isTreeNodeValue<T> (predicate: (value: T) => boolean) {
  return (treeNode: TreeNode<T>) => {
    return predicate(treeNode.getValueOrThrow())
  }
}

export function isFirstChild<T> (node: TreeNode<T>): boolean {
  return node.getFirstChild() == null
}

export function isLastChild<T> (node: TreeNode<T>): boolean {
  return node.getLastChild() == null
}

function fill (length: number, char: string = ' '): string {
  let s = ''
  for (let i = 0; i < length; i++) {
    s += char
  }
  return s
}

export interface TreeNodePojo<T = any> {
  value: T
  children?: TreeNodePojo<any>[]
}

export class Forest<V> {

  constructor (protected roots: Iterable<TreeNode<V>>) {
  }

  // order: root, left, right
  public forEach (fn: (node: TreeNode<V>) => void) {
    for (const node of this) fn(node)
  }

  // order: root, left, right
  public* [Symbol.iterator] () {
    const queue = [...this.roots]
    while (queue.length > 0) {
      const current = queue.shift()!
      yield current
      queue.push(...current.getChildren())
    }
  }

  public getRoots (): Iterable<TreeNode<V>> {
    return this.roots
  }

  public getRootCount (): number {
    return Array.from(this.roots).length
  }

  public getNthRoot (n: number): TreeNode<V> {
    const array = Array.from(this.getRoots())
    const result = array[n]
    if (result == null) {
      throw new RangeError(`Index ${n} out of range.`)
    }
    return result
  }

  public getFirstRoot (): TreeNode<V> {
    return this.getNthRoot(0)
  }

  public getLastRoot (): TreeNode<V> {
    return this.getNthRoot(this.getRootCount() - 1)
  }

  public getByChildPath (...path: number[]): TreeNode<V> {
    if (path.length <= 0) {
      throw new Error(`Path must have at least one item`)
    }
    let current = this.getNthRoot(path.shift()!)
    while (path.length > 0) {
      current = current.getNthChild(path.shift()!)!
    }
    return current
  }

  public printLeftPrefix (print: (v: V) => string = v => `${v}`): string {
    let string = `( `
    for (const root of this.roots) {
      string = string.concat(root.printLeftPrefix(print)).concat(` `)
    }
    return string.concat(`)`)
  }

  public printLeftPostfix (print: (v: V) => string = v => `${v}`): string {
    let string = `( `
    for (const root of this.roots) {
      string = string.concat(root.printLeftPostfix(print)).concat(` `)
    }
    return string.concat(`)`)
  }

  public printIndented (print: (v: V) => string = v => `${v}`, by: number = 2) {
    let string = ``
    let isFirst = true
    for (const root of this.roots) {
      if (!isFirst) {
        string = string.concat('\n')
      }
      isFirst = false
      string = string.concat(root.printIndented(print, by))
    }
    return string
  }

  // public find<R extends V> (predicate: Guard<TreeNode<V>>): TreeNode<R> | null
  // public find (predicate: UnaryPredicate<TreeNode<V>>): TreeNode<V> | null
  public find (predicate: (v: any) => boolean): TreeNode<V> | null {
    for (const root of this.roots) {
      const result = root.findInDescendantsAndSelf(predicate)
      if (result != null) {
        return result
      }
    }
    return null
  }

  public findOrFail<R extends V> (predicate: (v: TreeNode<V>) => v is TreeNode<R>): TreeNode<R>
  public findOrFail (predicate: (v: TreeNode<V>) => boolean): TreeNode<V>
  public findOrFail (predicate: (v: TreeNode<V>) => boolean): TreeNode<V> {
    const result = this.find(predicate)
    if (result != null) return result
    throw new Error(`A node in the forest was not found.`)
  }

  public findValue<R extends V> (predicate: (v: V) => v is R): TreeNode<R> | null
  public findValue (predicate: (v: V) => boolean): TreeNode<V> | null
  public findValue (predicate: (v: V) => boolean) {
    return this.find(isTreeNodeValue(predicate))
  }

  public findValueOrFail<R extends V> (predicate: (v: V) => v is R): TreeNode<R>
  public findValueOrFail (predicate: (v: V) => boolean): TreeNode<V>
  public findValueOrFail (predicate: (v: V) => boolean) {
    return this.findOrFail(isTreeNodeValue(predicate))
  }


}
