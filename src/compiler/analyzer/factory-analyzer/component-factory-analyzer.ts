import { ComponentAnalyzer } from '../component-analyzer'
import { FactoryAnalyzer } from './base-factory-analyzer'
import { Forest, TreeNode } from '../../utils/tree'
import { TemplateNodeComponentValue } from '../../template-nodes/nodes/component-node'
import { TemplateNodeValue } from '../../template-nodes/nodes/template-node-value-base'
import iterare from 'iterare'
import { getIntersection } from '../../utils/utils'
import { ViewBoundValue } from '../../template-nodes/view-bound-value'
import CodeBlockWriter from 'code-block-writer'
import { paramCase } from 'change-case'
import parseStyle from '../../style-parser'
import { echoize } from '../../utils/echoize'
import { ProjectAnalyzer } from '../project-analyzer'
import { commaLists } from 'common-tags'

export class ComponentFactoryIdentifier {

  constructor (
    public path: string,
    public name: string,
    public id: number,
  ) {
  }

}

export class ComponentFactoryAnalyzer extends FactoryAnalyzer<TemplateNodeComponentValue> {

  public identifier: ComponentFactoryIdentifier
  public componentAnalyzer: ComponentAnalyzer

  public getPartialViewFactoryAnalyzer (): this {
    return this
  }

  public getClassName (): string {
    return this.identifier.name
  }

  @echoize()
  public getComponentAbsoluteFilePathWithoutExtension (): string {
    const sourceFile = this.componentAnalyzer.classDeclaration.getSourceFile()
    return `${sourceFile.getDirectoryPath()}/${sourceFile.getBaseNameWithoutExtension()}`
  }

  public get templateDefinition (): Forest<TemplateNodeValue> {
    return this.componentAnalyzer.componentTemplateAnalyzer.getDefinition()
  }

  constructor (
    projectAnalyzer: ProjectAnalyzer,
    uniqueId: number,
    parentFactory: FactoryAnalyzer<TemplateNodeValue> | undefined,
    anchorViewNode: TreeNode<TemplateNodeComponentValue> | undefined,
    componentAnalyzer: ComponentAnalyzer,
  ) {
    super(projectAnalyzer, uniqueId, parentFactory, anchorViewNode)
    const path = componentAnalyzer.getFilePath()
    const name = componentAnalyzer.getComponentName()
    this.identifier = new ComponentFactoryIdentifier(path, name, uniqueId)
    this.componentAnalyzer = componentAnalyzer
  }

  @echoize()
  public canUpdatePropInThisComponentInstanceByCalling (methodName: string): boolean {
    return this.componentAnalyzer.getPropsWhichCanBeModifiedBy(methodName).size != 0
  }

  @echoize()
  public getPropAndGetterNames (): Set<string> {
    return this.componentAnalyzer.getNamesOfAllPropsAndGetters()
  }

  @echoize()
  public getMethodNames (): Set<string> {
    return this.componentAnalyzer.getNamesOfAllMethods()
  }

  @echoize()
  public hasDefinedAndResolvesTo (identifierAccessorPath: string): string | null {
    const allVariables = this.componentAnalyzer.getAllVariables()
    const allConstants = this.componentAnalyzer.getAllConstants()
    const allMethods = this.getMethodNames()
    const [name, ...rest] = identifierAccessorPath.split('.')

    if (allVariables.has(name) || allMethods.has(name)) {
      return `__wane__data.${identifierAccessorPath}`
    }

    if (allConstants.has(name)) {
      return `__wane__constants.${this.componentAnalyzer.getConstantName(name)}`
    }

    return null
  }

  public isScopeBoundary (): boolean {
    return true
  }

  @echoize()
  private _getBoundValuesTo (scopeFactory: FactoryAnalyzer<TemplateNodeValue>,
                             currentFactory: FactoryAnalyzer<TemplateNodeValue>): Set<ViewBoundValue> {
    const result = new Set<ViewBoundValue>()
    for (const node of currentFactory.view) {
      const templateNodeValue = node.getValueOrThrow()
      for (const binding of templateNodeValue.viewBindings) {
        const boundValue = binding.boundValue
        if (!boundValue.isConstant() && boundValue.getDefinitionFactory() == scopeFactory) {
          result.add(boundValue)
        }
      }
      if (!templateNodeValue.isPureDom && !templateNodeValue.getResponsibleFactory().isScopeBoundary()) {
        // w:if, w:else
        const childFactory = currentFactory.getChildren().get(node)
        if (childFactory == null) {
          throw new Error(`Expected to find child factory.`)
        }
        this._getBoundValuesTo(scopeFactory, childFactory).forEach(binding => {
          result.add(binding)
        })
      }
    }
    return result
  }

  @echoize()
  public getFactoryName (): string {
    return `${this.componentAnalyzer.getComponentName()}${this.uniqueId}`
  }

  /**
   * See: https://github.com/wane/wane/issues/18
   */
  @echoize()
  public getDomAssemblingSpecification (): { index: number, from: number, length: number }[] {
    const specification: { index: number, from: number, length: number }[] = []

    const queue = [...this.view.getRoots()]
    const rootIndexes = queue
      .map(root => root.getValueOrThrow().getIndexes())
      .reduce((acc, curr) => [...acc, ...curr], [])
    const lastIndex = rootIndexes[rootIndexes.length - 1]

    // handle roots
    specification.push({
      index: -1,
      from: 0,
      length: lastIndex + 1,
    })

    while (queue.length > 0) {
      const current = queue.shift()!

      if (current.hasChildren()) {
        const children = current.getChildren()
        queue.push(...children)
        const childrenIndexes = children
          .map(child => child.getValueOrThrow().getIndexes())
          .reduce((acc, curr) => [...acc, ...curr], [])
        const firstIndex = childrenIndexes[0]
        const lastIndex = childrenIndexes[childrenIndexes.length - 1]
        const domChildrenCount = lastIndex - firstIndex + 1
        specification.push({
          index: current.getValueOrThrow().getSingleIndex(),
          from: firstIndex,
          length: domChildrenCount,
        })
      }
    }

    return specification
  }

  public printAssemblingDomNodes (wr: CodeBlockWriter): CodeBlockWriter {
    const spec = this.getDomAssemblingSpecification()
      .filter(({ index }) => index != -1)
      .map(({ index, from, length }) => [index, from, length])
      .reduce((acc, curr) => [...acc, ...curr], [])
    const specString = commaLists`[${spec}]`

    const rootSpec = this.getDomAssemblingSpecification()
      .find(({ index }) => index == -1)!
    const rootsLength = rootSpec.length

    wr
      .newLineIfLastNot()
      .conditionalWriteLine(spec.length > 0, `util.__wane__assembleDom(this.__wane__domNodes, ${specString})`)

    if (rootsLength == 0) {
      // There's only one root
      wr.writeLine(`util.__wane__appendChild(this.__wane__root, this.__wane__domNodes[0]`)
    } else if (spec.length == 0) {
      // Everything is a root
      wr.writeLine(`util.__wane__appendChildren(this.__wane__root, this.__wane__domNodes)`)
    } else {
      // Only first few are roots
      wr.writeLine(`util.__wane__appendChildren(this.__wane__root, this.__wane__domNodes.slice(0, ${rootsLength}))`)
    }

    return wr
  }

  @echoize()
  public printRootDomNodeAssignment (wr: CodeBlockWriter): CodeBlockWriter {
    const left = `this.__wane__root`
    if (this.isRoot()) {
      return wr.writeLine(`${left} = document.body`)
    } else {
      const index = this.getParent().getSingleIndexFor(this.getAnchorViewNode().getValueOrThrow())
      return wr.writeLine(`${left} = this.__wane__factoryParent.__wane__domNodes[${index}]`)
    }
  }

  @echoize()
  public isAffectedByCalling (methodName: string): boolean {
    // all methods which can be invoked when methodName is invoked
    const allMethods = this.componentAnalyzer.getMethodsCalledFrom(methodName)
    allMethods.add(methodName)

    // all props which can be modified in this factory when invoking methodName
    const modifiableProps = iterare(allMethods)
      .map(method => this.componentAnalyzer.getPropsWhichCanBeModifiedBy(method))
      .flatten()

    // props bound to view in this component
    const propsBoundToView: Iterable<string> = this.getPropsBoundToView().keys()

    const intersection = getIntersection(modifiableProps, propsBoundToView)

    return Array.from(intersection).length > 0
  }

  @echoize()
  public getPropsBoundToView (): Map<string, string> {
    const result = new Map<string, string>()
    for (const prop of this.getPropAndGetterNames()) {
      const resolved = this.hasDefinedAndResolvesTo(prop)
      if (resolved != null) {
        result.set(prop, resolved)
      }
    }
    return result
  }

  /**
   * For components, we filter out things that we know are readonly
   * (meaning they cannot be changed from within the component).
   * @returns {Iterable<string>}
   */
  @echoize()
  public getDiffablePropNames (): Iterable<string> {
    return this.componentAnalyzer.getAllVariables()
  }

  @echoize()
  public domTagName (): string {
    if (this.isRoot()) {
      return `body`
    } else {
      return 'w-' + paramCase(this.getClassName())
    }
  }

  @echoize()
  public getStyles (): string | null {
    const inputDir = this.projectAnalyzer.compilerOptions.input
    const uniqueId = this.identifier.id
    const hostTagName = this.domTagName()
    const scss = this.componentAnalyzer.getStyles()
    if (scss == null) return null
    const resolveTagName = (tagName: string) => {
      const componentClassDeclaration = this.componentAnalyzer.getRegisteredClassDeclarationOrThrow(tagName)
      const componentAnalyzer = this.projectAnalyzer.getComponentAnalyzerByClassDeclaration(componentClassDeclaration)
      return componentAnalyzer.getDomTagName()
    }
    return parseStyle(uniqueId, hostTagName, resolveTagName, scss, inputDir)
  }

  @echoize()
  public hasStyles (): boolean {
    return this.componentAnalyzer.hasStyles()
  }

  @echoize()
  public toString (): string {
    return `ComponentFactoryAnalyzer#${this.getFactoryName()}`
  }

}
