import {Forest, isTreeNodeValue, TreeNode} from '../utils/tree'
import {TemplateNodeHtmlValue, TemplateNodeInterpolationValue} from '../template-nodes'
import {ComponentAnalyzer} from './component-analyzer'
import {ClassDeclaration, Type, TypeGuards} from 'ts-simple-ast'
import parseTemplate from '../template-parser/html'
import {ViewBinding} from '../template-nodes/view-bindings'
import {TemplateNodeComponentValue} from '../template-nodes/nodes/component-node'
import {TemplateNodeValue} from '../template-nodes/nodes/template-node-value-base'
import iterare from 'iterare'
import {echoize} from '../utils/echoize'
import * as ts from 'typescript'
import {isInstance} from '../utils/utils'

interface TemplateTypeError {
  position: {
    start: {
      index: number
      line: number
      column: number
    }
    end: {
      index: number
      line: number
      column: number
    }
  }
  expectedType: Type
  actualType: Type
}

export class ComponentTemplateAnalyzer {

  private _componentCompilerNode: ComponentAnalyzer

  @echoize()
  public getDefinition (): Forest<TemplateNodeValue> {
    const decorators = this.klass.getDecorators()
    const templateDecorator = decorators.find(deco => deco.getFullName() == 'Template')
    if (templateDecorator == null) {
      throw new Error(`Component ${this.klass.getName()} does not have a @Template.`)
    }
    const arg = templateDecorator.getArguments()[0]
    if (!TypeGuards.isNoSubstitutionTemplateLiteral(arg)) throw new Error(`Template must have a template literal as the first argument.`)
    const templateLiteral = arg
    const text = templateLiteral.getLiteralText()
    return parseTemplate(text)
  }

  private _bindings: Set<ViewBinding<TemplateNodeValue>> | undefined

  @echoize()
  private _getBindings (): Set<ViewBinding<TemplateNodeValue>> {
    const result = new Set<ViewBinding<TemplateNodeValue>>()
    this.forEach(node => {
      const bindings = node.getValueOrThrow().viewBindings
      for (const binding of bindings) {
        result.add(binding)
      }
    })
    return result
  }

  @echoize()
  public getNamesOfBoundProperties (): Set<ViewBinding<TemplateNodeValue>> {
    if (this._bindings == null) {
      this._bindings = this._getBindings()
    }
    return this._bindings
  }

  // public getNamesOfBoundMethods (): Set<string> {
  //   // TODO: cache
  //   const result = new Set<string>()
  //   this.forEach(node => {
  //     const names = this.getNamesOfMethodsBoundToNode(node)
  //     names.forEach(name => result.add(name))
  //   })
  //   return result
  // }

  constructor (klass: ClassDeclaration, componentCompilerNode: ComponentAnalyzer) {
    this._klass = klass
    this._componentCompilerNode = componentCompilerNode
  }

  public typeCheck () {
    const project = this._componentCompilerNode.projectAnalyzer.getProject()
    const typeChecker = project.getTypeChecker()
    const type = ts.TypeFlags
    // this.forEach(node => {
    //   const templateNodeValue = node.getValueOrThrow()
    //   const bindings = templateNodeValue.viewBindings
    //   for (const binding of bindings) {
    //
    //   }
    // })
    this.componentNodes().forEach(node => {
      const componentNode = node.getValueOrThrow()
      const inputBindings = [...componentNode.getInputBindings()]
      inputBindings.forEach(inputBinding => {
        const type = inputBinding.getExpectedType()
      })
    })
  }

  private _klass: ClassDeclaration | undefined
  private get klass (): ClassDeclaration {
    if (this._klass == null) throw new Error(`Attempted to use a ComponentTemplateCompilerNode without loading it with a class.`)
    return this._klass
  }

  public forEach (callback: (node: TreeNode<TemplateNodeValue>) => void) {
    const roots = this.getDefinition()
    for (const root of roots) {
      root.forEach(callback)
    }
  }

  public filter<T extends TemplateNodeValue> (predicate: (node: TreeNode<any>) => node is TreeNode<T>): Set<TreeNode<T>>
  public filter<T extends TemplateNodeValue> (predicate: (node: TreeNode<any>) => boolean): Set<TreeNode<T>> {
    const set = new Set<TreeNode<T>>()
    this.forEach(node => {
      if (predicate(node)) {
        set.add(node as TreeNode<T>)
      }
    })
    return set
  }

  @echoize()
  public textNodes () {
    const predicate = isTreeNodeValue(isInstance(TemplateNodeInterpolationValue))
    return this.filter(predicate)
  }

  @echoize()
  public interpolationNodes () {
    const predicate = isTreeNodeValue(isInstance(TemplateNodeInterpolationValue))
    return this.filter(predicate)
  }

  @echoize()
  public htmlNodes () {
    const predicate = isTreeNodeValue(isInstance(TemplateNodeHtmlValue))
    return this.filter(predicate)
  }

  @echoize()
  public componentNodes () {
    const predicate = isTreeNodeValue(isInstance(TemplateNodeComponentValue))
    return this.filter(predicate)
  }

  // public getNamesOfMethodsBoundToNode (node: TreeNode<TemplateNodeValue>): Set<string> {
  //   const value = node.getValueOrThrow()
  //   return value.getNamesOfBoundMethods()
  // }

  @echoize()
  private getComponentNames (): Set<string> {
    const componentNames = new Set<string>()
    this.forEach(node => {
      const value = node.getValueOrThrow()
      if (value instanceof TemplateNodeComponentValue) {
        componentNames.add(value.getTagName())
      }
    })
    return componentNames
  }

  @echoize()
  public toString () {
    return iterare(this.getDefinition())
      .map(tree => tree.printIndented())
      .join('\n')
  }

}
