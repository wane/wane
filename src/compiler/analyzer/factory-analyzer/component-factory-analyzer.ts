import { ComponentAnalyzer } from '../component-analyzer'
import { FactoryAnalyzer } from './base-factory-analyzer'
import { Forest, TreeNode } from '../../utils/tree'
import { TemplateNodeComponentValue } from '../../template-nodes/nodes/component-node'
import { TemplateNodeValue } from '../../template-nodes/nodes/template-node-value-base'
import iterare from 'iterare'
import { getIntersection } from '../../utils/utils'
import { ViewBoundValue } from '../../template-nodes/view-bound-value'
import CodeBlockWriter from 'code-block-writer'

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

  public getPartialViewFactoryAnalyzer(): this {
    return this
  }

  public getClassName (): string {
    return this.identifier.name
  }

  public getComponentAbsoluteFilePathWithoutExtension (): string {
    const sourceFile = this.componentAnalyzer.classDeclaration.getSourceFile()
    return `${sourceFile.getDirectoryPath()}/${sourceFile.getBaseNameWithoutExtension()}`
  }

  public get templateDefinition (): Forest<TemplateNodeValue> {
    return this.componentAnalyzer.componentTemplateAnalyzer.getDefinition()
  }

  constructor (
    uniqueId: number,
    parentFactory: FactoryAnalyzer<TemplateNodeValue> | undefined,
    anchorViewNode: TreeNode<TemplateNodeComponentValue> | undefined,
    componentAnalyzer: ComponentAnalyzer,
  ) {
    super(uniqueId, parentFactory, anchorViewNode)
    const path = componentAnalyzer.getFilePath()
    const name = componentAnalyzer.getClassName()
    this.identifier = new ComponentFactoryIdentifier(path, name, uniqueId)
    this.componentAnalyzer = componentAnalyzer
  }

  public canUpdatePropInThisComponentInstanceByCalling (methodName: string): boolean {
    return this.componentAnalyzer.getPropsWhichCanBeModifiedBy(methodName).size != 0
  }

  public getPropAndGetterNames (): Set<string> {
    return this.componentAnalyzer.getNamesOfAllPropsAndGetters()
  }

  public getMethodNames (): Set<string> {
    return this.componentAnalyzer.getNamesOfAllMethods()
  }

  public hasDefinedAndResolvesTo (identifierAccessorPath: string): string | null {
    const allProps = this.getPropAndGetterNames()
    const allMethods = this.getMethodNames()
    const [name, ...rest] = identifierAccessorPath.split('.')
    return allProps.has(name) || allMethods.has(name) ? identifierAccessorPath : null
  }

  public isScopeBoundary (): boolean {
    return true
  }

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

  public getFactoryName (): string {
    return `${this.componentAnalyzer.getClassName()}${this.uniqueId}`
  }

  public printAssemblingDomNodes (wr: CodeBlockWriter): CodeBlockWriter {
    return wr
      .newLineIfLastNot()
      .writeLine(`util.__wane__appendChildren(this.__wane__root, [`)
      .indentBlock(() => this.printAssemblingDomNodesGeneric(wr))
      .writeLine(`])`)
  }

  public printRootDomNodeAssignment (wr: CodeBlockWriter): CodeBlockWriter {
    const left = `this.__wane__root`
    if (this.isRoot()) {
      return wr.writeLine(`${left} = document.body`)
    } else {
      const index = this.getParent().getSingleIndexFor(this.getAnchorViewNode().getValueOrThrow())
      return wr.writeLine(`${left} = this.__wane__factoryParent.__wane__domNodes[${index}]`)
    }
  }

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

  public toString (): string {
    return `ComponentFactoryAnalyzer#${this.getFactoryName()}`
  }

}
