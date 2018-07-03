import { Forest, TreeNode } from '../../utils/tree'
import { TemplateNodeValue } from '../../template-nodes/nodes/template-node-value-base'
import { ComponentOutputBinding, ViewBinding } from '../../template-nodes/view-bindings'
import CodeBlockWriter from 'code-block-writer'
import { createOrAddToSet, getIntersection, has } from '../../utils/utils'
import { ViewBoundMethodCall, ViewBoundPropertyAccess } from '../../template-nodes/view-bound-value'
import { paramCase } from 'change-case'
import { ComponentFactoryAnalyzer } from './component-factory-analyzer'
import { getPath, printTreePath } from '../../utils/graph'

export abstract class FactoryAnalyzer<Anchor extends TemplateNodeValue> {

  protected readonly uniqueId: number

  protected readonly parent: FactoryAnalyzer<TemplateNodeValue> | undefined
  protected readonly children = new Map<TreeNode<TemplateNodeValue>, FactoryAnalyzer<TemplateNodeValue>>()

  private _view!: Forest<TemplateNodeValue>

  public set view (view: Forest<TemplateNodeValue>) {
    this._view = view
  }

  public get view (): Forest<TemplateNodeValue> {
    if (this._view == null) {
      throw new Error(`No view set for "${this.getFactoryName()}".`)
    }
    return this._view
  }

  public abstract templateDefinition: Forest<TemplateNodeValue>

  protected readonly anchorViewNode: TreeNode<Anchor> | undefined

  public abstract getPartialViewFactoryAnalyzer (): FactoryAnalyzer<TemplateNodeValue>

  public getFirstScopeBoundaryUpwardsIncludingSelf (): ComponentFactoryAnalyzer {
    let current: FactoryAnalyzer<TemplateNodeValue> = this
    while (!current.isScopeBoundary()) {
      const parent = current.getParentOrUndefined()
      if (parent == null) {
        throw new Error(`Could not find a scope boundary above "${this.getFactoryName()}", which is also not a scope factory.`)
      }
      current = parent
    }
    return current as ComponentFactoryAnalyzer
  }

  constructor (
    uniqueId: number,
    parent: FactoryAnalyzer<TemplateNodeValue> | undefined,
    anchorViewNode: TreeNode<Anchor> | undefined,
  ) {
    this.uniqueId = uniqueId
    this.parent = parent
    this.anchorViewNode = anchorViewNode
  }

  /**
   * @example `CounterCmp_1`
   * @example `ConditionalView_2`
   * @example `RepeatingView_3`
   * @returns {string}
   */
  public abstract getFactoryName (): string

  public getFactoryFilename (): string {
    return `${paramCase(this.getFactoryName())}`
  }

  public getFactoryFilenameWithExtension (): string {
    return `${this.getFactoryFilename()}.ts`
  }

  public getParentOrUndefined (): FactoryAnalyzer<TemplateNodeValue> | undefined {
    return this.parent
  }

  public getParent (): FactoryAnalyzer<TemplateNodeValue> {
    if (this.parent == null) {
      throw new Error(`Factory Analyzer "${this.uniqueId}" has no parent. ` +
        `It's either root or it hasn't been set properly.`)
    }
    return this.parent
  }

  public isRoot (): boolean {
    return this.getParentOrUndefined() == undefined
  }

  public getChildren (): Map<TreeNode<TemplateNodeValue>, FactoryAnalyzer<TemplateNodeValue>> {
    return this.children
  }

  public getChildrenFactories (): Iterable<FactoryAnalyzer<TemplateNodeValue>> {
    return this.getChildren().values()
  }

  public getFirstChild<T extends FactoryAnalyzer<TemplateNodeValue> = FactoryAnalyzer<TemplateNodeValue>> (): T {
    return Array.from(this.children.values())[0] as T
  }

  public getLastChild (): FactoryAnalyzer<TemplateNodeValue> {
    const array = Array.from(this.children.values())
    return array[array.length - 1]
  }

  public getChildAtIndex (index: number): FactoryAnalyzer<TemplateNodeValue> {
    const array = Array.from(this.children.values())
    const factory = array[index]
    if (factory == null) {
      throw new RangeError(`Index out of bounds.`)
    }
    return factory
  }

  public hasChildren (): boolean {
    return this.getChildren().size > 0
  }

  public registerChild (node: TreeNode<TemplateNodeValue>, child: FactoryAnalyzer<TemplateNodeValue>): void {
    if (this.children.has(node)) {
      throw new Error(`Factory Analyzer "${this.uniqueId}" already has this node pointing at a child factory.`)
    }
    this.children.set(node, child)
  }

  public getAnchorViewNode (): TreeNode<Anchor> {
    if (this.anchorViewNode == null) {
      throw new Error(`Factory Analyzer "${this.uniqueId}" has no anchor view node because it's the root.`)
    }
    return this.anchorViewNode
  }

  public getAnchorViewNodeOrUndefined (): TreeNode<Anchor> | undefined {
    return this.anchorViewNode
  }

  /**
   * Get an array of factories which lead to another factory. Includes the starting and ending factory.
   * @param {FactoryAnalyzer<TemplateNodeValue>} fa The factory to reach.
   * @returns {FactoryAnalyzer<TemplateNodeValue>[]} The path, including both start and end.
   */
  public getPathTo (fa: FactoryAnalyzer<TemplateNodeValue>): FactoryAnalyzer<TemplateNodeValue>[] {
    return getPath<FactoryAnalyzer<TemplateNodeValue>>(
      f => f.getNeighbors(),
      this,
      fa,
    )
  }

  public isHopToParent (to: FactoryAnalyzer<TemplateNodeValue>): boolean {
    return this.getParentOrUndefined() == to
  }

  public printHopToParent (isStartingHop: boolean, isEndingHop: boolean): string {
    return `__wane__factoryParent`
  }

  public printHopToChild (to: FactoryAnalyzer<TemplateNodeValue>): string {
    return `__wane__factoryChildren[${to.getFactoryIndexAsChild()} /*${to.getFactoryName()}*/]`
  }

  public printPathTo (fa: FactoryAnalyzer<TemplateNodeValue>): string {
    // console.log(` Path from ${this.getFactoryName()} to ${fa.getFactoryName()}`)
    const isHopToParent = (from: FactoryAnalyzer<TemplateNodeValue>, to: FactoryAnalyzer<TemplateNodeValue>) =>
      from.isHopToParent(to)
    const printHopToParent = (from: FactoryAnalyzer<TemplateNodeValue>, to: FactoryAnalyzer<TemplateNodeValue>, isStartingHop: boolean, isEndingHop: boolean) => {
      return from.printHopToParent(isStartingHop, isEndingHop)
    }
    const printHopToChild = (from: FactoryAnalyzer<TemplateNodeValue>, to: FactoryAnalyzer<TemplateNodeValue>) =>
      from.printHopToChild(to)
    const path = this.getPathTo(fa)
    // console.log(path.map(p => p.getFactoryName()).join(` -> `))
    const printed = printTreePath(isHopToParent, printHopToParent, printHopToChild, path)
    // console.log(printed)
    return printed
  }

  /**
   * Components create a boundary to the scope, while partial views do not.
   *
   * @example
   * ComponentA has variable "foo", and it has ComponentB in its template.
   * ComponentB has variable "bar".
   * If ComponentB tries referencing "foo" in its template, it will not work.
   *
   * @example
   * ComponentA has variable "foo", and an w:if in its template.
   * Inside the w:if, it references the "foo" variable in the template interpolation.
   * Internally, interpolating "foo" is responsibility of the w:if, but the value will be accessed
   * from the ComponentA.
   *
   * @returns {boolean}
   */
  public abstract isScopeBoundary (): boolean

  /**
   * Check if this factory can resolve the given prop access path and return
   * the string which represents the in-memory representation of how this property
   * can be accessed.
   *
   * If nothing defined can be found, it returns null.
   *
   * This allows for template-only aliases to variables, for example in for-loops.
   *
   * @example
   *
   * ```
   * <w:for foo of foos>
   *   {{ foo }}
   * </w:for>
   * ```
   *
   * The `foo` is here resolved as `this.__wane__data`.
   *
   * ```
   * {{ foo }}
   * ```
   *
   * Here, `foo` is resolved simply as `foo`.
   *
   * @param {string} propAccessPath The accessor path to look for.
   */
  public abstract hasDefinedAndResolvesTo (propAccessPath: string): string | null

  /**
   * What is bound to this component/partial fom the outside?
   * Ie, when this component was used in a template, what was bound to it?
   *
   * @returns {Set<ViewBinding>}
   */
  public getSelfBindings (): Iterable<ViewBinding<Anchor>> {
    const anchor = this.getAnchorViewNodeOrUndefined()
    if (anchor == null) {
      return new Set()
    } else {
      return anchor.getValueOrThrow().viewBindings
    }
  }

  /**
   * Things bound to the view.
   * Doesn't have to mean that this factory is responsible for them.
   * Note that this includes all the text and simple html elements.
   * They count as bindings, but they are a constant.
   * @returns {Set<ViewBinding<TemplateNodeValue>>}
   */
  public getHtmlNativeDomBindings (): Set<ViewBinding<TemplateNodeValue>> {
    const result = new Set<ViewBinding<TemplateNodeValue>>()
    for (const node of this.view) {
      const templateNodeValue = node.getValueOrThrow()
      for (const binding of templateNodeValue.viewBindings) {
        if (binding.isNativeHtml()) {
          result.add(binding)
        }
      }
    }
    return result
  }

  // TODO: Figure out what's the difference with the two methods above?
  /**
   * Returns a map that maps the view name to the actual name in the model.
   * This enables aliases in view.
   *
   * @example
   *
   * In the following snippet, `foo` is mapped to` __wane__data` and `number` is bound to `__wane__index`.
   *
   * ```
   * <w:for (foo, number) of foos>{{ number }}: {{ foo }}</w:for>
   * ```
   *
   * @returns {Map<string, string>}
   */
  public abstract getPropsBoundToView (): Map<string, string>

  /**
   * These are only ancestor factories... I think.
   *
   * @param {string} methodName
   * @returns {Iterable<FactoryAnalyzer<TemplateNodeValue>>}
   */
  public getFactoriesAffectedByCalling (methodName: string): Iterable<FactoryAnalyzer<TemplateNodeValue>> {
    const resolved = this.getFirstScopeBoundaryUpwardsIncludingSelf().hasDefinedAndResolvesTo(methodName)
    if (resolved == null) {
      throw new Error(`Method named "${methodName}" is not defined on factory "${this.getFactoryName()}".`)
    }
    const result = new Set<FactoryAnalyzer<TemplateNodeValue>>()

    const anchorViewNode = this.getFirstScopeBoundaryUpwardsIncludingSelf().getAnchorViewNodeOrUndefined()
    if (anchorViewNode != null) {
      const anchorView = anchorViewNode.getValueOrThrow()

      // const outputBindings = new Set<ComponentOutputBinding>()
      for (const binding of anchorView.viewBindings) {
        if (binding instanceof ComponentOutputBinding) {
          const boundValue = binding.boundValue
          const boundValueMethodName = boundValue.getName()
          const outputName = binding.getName()
          const originFactory = boundValue.getDefinitionFactory() as ComponentFactoryAnalyzer

          // we skip this binding if it cannot be called when methodName is invoked...
          const allMethods = this.getFirstScopeBoundaryUpwardsIncludingSelf()
            .componentAnalyzer
            .getMethodsCalledFrom(methodName)
          allMethods.add(methodName) // ...including itself, of course

          if (!allMethods.has(outputName)) {
            continue
          }

          const propsWhichCanBeModified = originFactory.componentAnalyzer.getPropsWhichCanBeModifiedBy(boundValueMethodName)
          const propsWhichAffectView = originFactory.getPropsBoundToView().keys()

          const intersection = new Set(getIntersection(propsWhichCanBeModified, propsWhichAffectView))
          if (intersection.size != 0) {
            result.add(originFactory)
          }
        }
      }
    }

    if (this.getFirstScopeBoundaryUpwardsIncludingSelf().isAffectedByCalling(methodName)) {
      result.add(this.getFirstScopeBoundaryUpwardsIncludingSelf())
    }

    return result
  }

  public isChildOf (fa: FactoryAnalyzer<TemplateNodeValue>): boolean {
    return [...fa.getChildrenFactories()].includes(this)
  }

  public getFactoryIndexAsChild (): number {
    if (this.parent == null) {
      throw new Error(`A root ("${this.getFactoryName()}") cannot have a factory index because it is not a child.`)
    }
    const siblings = [...this.parent.children.values()]
    const index = siblings.findIndex(f => f == this)
    if (index == -1) {
      const thisName = this.getFactoryName()
      const parentName = this.parent.getFactoryName()
      throw new Error(`Could not find self ("${thisName}") in the children of parent ("${parentName}").`)
    }
    return index
  }

  public getIndexesFor (templateNode: TemplateNodeValue): number[] {
    const indexes: number[] = []
    const flatNodes = this.getSavedNodes()
    for (let index = 0; index < flatNodes.length; index++) {
      const flatNode = flatNodes[index]
      if (flatNode == templateNode) {
        indexes.push(index)
      }
    }

    if (indexes.length == 0) {
      throw new Error(`Cannot find index for this template node.`)
    }

    return indexes
  }

  public getSingleIndexFor (templateNode: TemplateNodeValue): number {
    const indexes = this.getIndexesFor(templateNode)
    if (indexes.length != 1) {
      throw new Error(`Expected Factory Analyzer to have only one index for a Template Node. Instead it had ${indexes.length}: ${indexes.join(', ')}.`)
    }
    return indexes[0]
  }

  public getSavedNodes (): TemplateNodeValue[] {
    const flat: TemplateNodeValue[] = []
    for (const node of this.getPartialViewFactoryAnalyzer().view) {
      const value = node.getValueOrThrow()
      for (let i = 0; i < value.domNodesCount; i++) {
        flat.push(value)
      }
    }
    return flat
  }

  public abstract printAssemblingDomNodes (wr: CodeBlockWriter): CodeBlockWriter

  private _printAssemblingDomNodesGeneric (wr: CodeBlockWriter,
                                           node: TreeNode<TemplateNodeValue>): CodeBlockWriter {
    const indexes = this.getIndexesFor(node.getValueOrThrow())
    const children = node.getChildren()
    for (const index of indexes) {
      if (children.length == 0) {
        wr.writeLine(`this.__wane__domNodes[${index}],`)
      } else {
        wr.writeLine(`util.__wane__appendChildren(this.__wane__domNodes[${index}], [`)
          .indentBlock(() => {
            for (const child of children) {
              this._printAssemblingDomNodesGeneric(wr, child)
            }
          })
          .writeLine(`])`)
      }
    }
    return wr
  }

  protected printAssemblingDomNodesGeneric (wr: CodeBlockWriter): CodeBlockWriter {
    for (const root of this.view.getRoots()) {
      this._printAssemblingDomNodesGeneric(wr, root)
    }
    return wr
  }

  public abstract printRootDomNodeAssignment (wr: CodeBlockWriter): CodeBlockWriter

  public factoryAnalyzersInScope (options: Partial<{ skipSelf: boolean }> = {}): Iterable<FactoryAnalyzer<TemplateNodeValue>> {
    const { skipSelf = false } = options
    const self = this
    return {
      [Symbol.iterator]: function* () {
        if (!skipSelf) {
          yield self
        }

        const queue: FactoryAnalyzer<TemplateNodeValue>[] = [...self.getChildrenFactories()]
        while (queue.length > 0) {
          const current = queue.shift()!
          yield current
          if (!current.isScopeBoundary()) {
            queue.push(...current.getChildrenFactories())
          }
        }
      },
    }
  }

  public domNodesInScope (): Iterable<TemplateNodeValue> {
    const self = this
    return {
      [Symbol.iterator]: function* () {
        for (const factory of self.factoryAnalyzersInScope()) {
          for (const node of factory.view) {
            yield node.getValueOrThrow()
          }
        }
      },
    }
  }

  /**
   * The returned map maps the index number of the DOM node to the prop access which needs to be diff'd.
   *
   * @returns {Map<number, Set<ViewBoundPropertyAccess>>}
   */
  public getDomDiffMap (): Map<number, Set<ViewBoundPropertyAccess>> {
    const result = new Map<number, Set<ViewBoundPropertyAccess>>()
    for (const node of this.domNodesInScope()) {
      if (node.isPureDom) {
        const index = node.getSingleIndex()
        for (const binding of node.viewBindings) {
          const responsibleFactory = binding.getResponsibleFactory()
          const boundValue = binding.boundValue
          if (this == responsibleFactory && boundValue instanceof ViewBoundPropertyAccess && !(boundValue instanceof ViewBoundMethodCall)) {
            result.set(index, createOrAddToSet(boundValue, result.get(index)))
          }
        }
      }
    }
    return result
  }

  public getFaDiffMap (): Map<FactoryAnalyzer<TemplateNodeValue>, Set<ViewBoundPropertyAccess>> {
    const result = new Map<FactoryAnalyzer<TemplateNodeValue>, Set<ViewBoundPropertyAccess>>()

    const factories = this.factoryAnalyzersInScope({ skipSelf: true })
    for (const factory of factories) {
      const bindings = [...factory.getSelfBindings()]
      if (!factory.isScopeBoundary()) {
        // We do not care for what's bound INSIDE the component (= scope boundary),
        // only what's bound to it.
        bindings.push(...factory.getHtmlNativeDomBindings())
      }
      // console.log([...bindings].map(x => x.getTemplateNode().toString()))
      for (const binding of bindings) {
        const responsibleFactory = binding.getResponsibleFactory()
        const definitionFactory = binding.getDefinitionFactory()
        const boundValue = binding.boundValue
        if (responsibleFactory.getPathTo(definitionFactory).includes(this) && boundValue instanceof ViewBoundPropertyAccess && !(boundValue instanceof ViewBoundMethodCall)) {
          // console.log('adding', boundValue)
          result.set(factory, createOrAddToSet(boundValue, result.get(factory)))
        }
      }
    }

    return result
  }

  public responsibleFor (): Set<ViewBoundPropertyAccess> {
    const result = new Set<ViewBoundPropertyAccess>()

    for (const bindings of this.getDomDiffMap().values()) {
      for (const binding of bindings) {
// We must be careful to not add the same thing twice because it would create an object such as this:
        // { foo: ..., foo: ...}. Not only this is invalid in strict mode, it also breaks the logic of
        // calculating if there is a diff or not.
        if (!has(result, existingBinding => existingBinding.getName() == binding.getName())) {
          result.add(binding)
        }
      }
    }

    for (const bindings of this.getFaDiffMap().values()) {
      for (const binding of bindings) {
        if (!has(result, existingBinding => existingBinding.getName() == binding.getName())) {
          result.add(binding)
        }
      }
    }

    return result
  }

  public getNeighbors (): FactoryAnalyzer<TemplateNodeValue>[] {
    const neighbors: FactoryAnalyzer<TemplateNodeValue>[] = []
    const parent = this.getParentOrUndefined()
    if (parent != null) neighbors.push(parent)
    neighbors.push(...this.getChildrenFactories())
    return neighbors
  }

  /**
   * Includes self.
   * @returns {FactoryAnalyzer<TemplateNodeValue>[]}
   */
  public getPathToRoot (): FactoryAnalyzer<TemplateNodeValue>[] {
    const result: Array<FactoryAnalyzer<TemplateNodeValue>> = [this]
    let current = this.getParentOrUndefined()
    while (current != null) {
      result.push(current)
      current = current.getParentOrUndefined()
    }
    return result
  }

  /**
   * Get everything that should be diffed in this factory's diff method.
   * @returns {Iterable<string>}
   */
  public getDiffablePropNames (): Iterable<string> {
    return [...this.responsibleFor()]
      .filter(boundValue => {
        const path = this.hasDefinedAndResolvesTo(boundValue.getRawPath())
        return path != null
      })
      .map(boundValue => {
        const path = this.hasDefinedAndResolvesTo(boundValue.getRawPath())!
        const [name] = path.split('.')
        return name
      })
  }

}
