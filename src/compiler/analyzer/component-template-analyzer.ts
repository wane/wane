import { Forest, TreeNode } from '../utils/tree'
import { TemplateNodeHtmlValue, TemplateNodeInterpolationValue } from '../template-nodes'
import { ComponentAnalyzer } from './component-analyzer'
import { ClassDeclaration, Decorator, TypeGuards } from 'ts-simple-ast'
import parseTemplate from '../template-parser/html'
import { ViewBinding } from '../template-nodes/view-bindings'
import { TemplateNodeComponentValue } from '../template-nodes/nodes/component-node'
import { TemplateNodeValue } from '../template-nodes/nodes/template-node-value-base'
import iterare from 'iterare'
import { echoize } from '../utils/echoize'
import { oneLine } from 'common-tags'
import { ProjectAnalyzer } from './project-analyzer'

export class ComponentTemplateAnalyzer {

  private _componentCompilerNode: ComponentAnalyzer | undefined

  @echoize()
  public getDefinition (): Forest<TemplateNodeValue> {
    const decorators = this.klass.getDecorators() as Decorator[]

    const templateDecorator = decorators.find(deco => deco.getFullName() == 'Template')
    if (templateDecorator == null) {
      throw new Error(oneLine`Component ${this.klass.getName()} does not have
        a @Template decorator.`)
    }

    const arg = templateDecorator.getArguments()[0]
    if (!TypeGuards.isNoSubstitutionTemplateLiteral(arg)) {
      throw new Error(`Template must have a template literal as the first argument.`)
    }

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

  constructor (public projectAnalyzer: ProjectAnalyzer,
               klass: ClassDeclaration,
               componentCompilerNode: ComponentAnalyzer,
  ) {
    this._klass = klass
    this._componentCompilerNode = componentCompilerNode
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
    return this.filter<TemplateNodeInterpolationValue>(node => {
      return node.getValueOrThrow() instanceof TemplateNodeInterpolationValue
    })
  }

  @echoize()
  public interpolationNodes () {
    return this.filter<TemplateNodeInterpolationValue>(node => {
      return node.getValueOrThrow() instanceof TemplateNodeInterpolationValue
    })
  }

  @echoize()
  public htmlNodes () {
    return this.filter<TemplateNodeHtmlValue>(node => {
      return node.getValueOrThrow() instanceof TemplateNodeHtmlValue
    })
  }

  @echoize()
  public componentNodes () {
    return this.filter<TemplateNodeComponentValue>(node => {
      return node.getValueOrThrow() instanceof TemplateNodeComponentValue
    })
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
