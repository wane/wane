import { ComponentAnalyzer } from '../component-analyzer'
import { FactoryAnalyzer } from './base-factory-analyzer'
import { Forest, TreeNode } from '../../utils/tree'
import { ComponentOutputBinding } from '../../template-nodes/view-bindings'
import { TemplateNodeComponentValue } from '../../template-nodes/nodes/component-node'
import { TemplateNodeValue } from '../../template-nodes/nodes/template-node-value-base'
import iterare from 'iterare'
import { getIntersection, isInstance } from '../../utils/utils'
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

  public getNamesOfMethodsDefinedOnParentWhichCanBeCalledByCalling (methodName: string): Set<string> {
    const anchorView = this.getAnchorViewNodeOrUndefined()

    // cannot fire event to parent if there is no parent
    if (anchorView == null) return new Set()

    const outputs = iterare(anchorView.getValueOrThrow().viewBindings)
      .filter(isInstance(ComponentOutputBinding))
      .map(binding => binding as ComponentOutputBinding)
    const outputNames = outputs.map(binding => binding.getName()).toSet()

    // check if the output is called directly from the view
    if (outputNames.has(methodName)) {
      const outputName = methodName
      const nameOfMethodOnParent = outputs.reduce<string | null>((acc, curr) => outputName == curr.getName()
        ? curr.getName()
        : null, null)
      if (nameOfMethodOnParent == null) {
        throw new Error(`Expect to find ${outputName} in outputs.`)
      }
      return new Set([nameOfMethodOnParent])
    }

    const methodsThatCanBeCalled = this.componentAnalyzer.getMethodsCalledFrom(methodName)

    let intersection = new Set<string>()
    for (const outputName of outputNames) {
      for (const method of methodsThatCanBeCalled) {
        if (outputName == method) {
          intersection.add(outputName)
        }
      }
    }

    const result = new Set<string>()
    for (const outputName of intersection) {
      const nameOfMethodOnParent = outputs.reduce<string | null>((acc, curr) => outputName == curr.getName()
        ? curr.getName()
        : null, null)
      if (nameOfMethodOnParent == null) {
        throw new Error(`Expect to find ${outputName} in outputs.`)
      }
      result.add(nameOfMethodOnParent)
    }

    return result
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

  public hasDefined (identifierAccessorPath: string): boolean {
    const allProps = this.getPropAndGetterNames()
    const allMethods = this.getMethodNames()
    const [name, ...rest] = identifierAccessorPath.split('.')
    return allProps.has(name) || allMethods.has(name)
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
        if (!boundValue.isConstant() && boundValue.getScopeFactory() == scopeFactory) {
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
    const propsBoundToView = this.getPropsBoundToView()

    const intersection = getIntersection(modifiableProps, propsBoundToView)

    return Array.from(intersection).length > 0
  }

  public getPropsBoundToView (): Iterable<string> {
    const result = new Set<string>()
    for (const prop of this.getPropAndGetterNames()) {
      if (this.hasDefined(prop)) {
        result.add(prop)
      }
    }
    return result
  }

  public toString (): string {
    return `ComponentFactoryAnalyzer#${this.getFactoryName()}`
  }

}
