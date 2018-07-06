import { ViewBinding } from '../view-bindings'
import { TemplateNodeValue } from '../nodes/template-node-value-base'
import { FactoryAnalyzer } from '../../analyzer'
import { isInstance } from '../../utils/utils'
import { ComponentFactoryAnalyzer } from '../../analyzer/factory-analyzer/component-factory-analyzer'

export abstract class ViewBoundValue {

  private _viewBinding: ViewBinding<TemplateNodeValue> | undefined

  public registerViewBinding (viewBinding: ViewBinding<TemplateNodeValue>): this {
    this._viewBinding = viewBinding
    return this
  }

  public getViewBinding (): ViewBinding<TemplateNodeValue> {
    if (this._viewBinding == null) {
      console.error(this)
      throw new Error(`No ViewBinding is registered to this ViewBoundValue.`)
    }
    return this._viewBinding
  }

  /**
   * Factory responsible for updating this binding.
   * Meaning that the view of this factory contains a node with this binding.
   * @returns {FactoryAnalyzer<TemplateNodeValue>}
   */
  public getResponsibleFactory () {
    return this.getViewBinding().getTemplateNode().getResponsibleFactory()
  }

  /**
   * The first scope boundary factory.
   * @returns {FactoryAnalyzer<TemplateNodeValue>}
   */
  public getFirstScopeBoundaryUpwardsIncludingSelf (): FactoryAnalyzer<TemplateNodeValue> {
    return this.getResponsibleFactory().getFirstScopeBoundaryUpwardsIncludingSelf()
  }

  public abstract getDefinitionFactory (): FactoryAnalyzer<TemplateNodeValue>

  public abstract resolve (from?: FactoryAnalyzer<TemplateNodeValue>): string

  public abstract isConstant (): boolean

}

export class ViewBoundConstant extends ViewBoundValue {

  constructor (protected value: string) {
    super()
  }

  public getDefinitionFactory (): FactoryAnalyzer<TemplateNodeValue> {
    return this.getResponsibleFactory()
  }

  public resolve (): string {
    return this.value
  }

  public isConstant (): boolean {
    return true
  }

}

export class ViewBoundPropertyAccess extends ViewBoundValue {

  constructor (protected path: string) {
    super()
  }

  public getName (): string {
    const [name] = this.path.split('.')
    return name
  }

  public getRawPath (): string {
    return this.path
  }

  public getDefinitionFactory (): FactoryAnalyzer<TemplateNodeValue> {
    let current = this.getResponsibleFactory()
    while (!current.hasDefinedAndResolvesTo(this.getName())) {
      const parent = current.getParentOrUndefined()
      if (parent == null) {
        throw new Error(`Cannot determine scope factory for "${this.path}".`)
      }
      current = parent
    }
    return current
  }

  public resolveFactory (from: FactoryAnalyzer<TemplateNodeValue> = this.getResponsibleFactory()) {
    const scopeFactory = this.getDefinitionFactory()
    const chain = from.printPathTo(scopeFactory)
    return `this${chain}`
  }

  public resolveNameInFactory () {
    const resolvedName = this.getDefinitionFactory().hasDefinedAndResolvesTo(this.path)
    if (resolvedName == null) {
      throw new Error(`Expected resolved name not to be null.`)
    }
    return `${resolvedName}`
  }

  public resolve (from: FactoryAnalyzer<TemplateNodeValue> = this.getResponsibleFactory()): string {
    const name = this.resolveNameInFactory()
    if (this.isConstant()) {
      return name
    } else {
      const factory = this.resolveFactory(from)
      return `${factory}.${name}`
    }
  }

  public isConstant (): boolean {
    const definitionFactory = this.getDefinitionFactory()
    if (definitionFactory instanceof ComponentFactoryAnalyzer) {
      const canBeModified = definitionFactory.componentAnalyzer.canPropBeModified(this.getName())
      return !canBeModified
    }
    return false
  }

  public static printCondition (boundValues: Iterable<ViewBoundPropertyAccess>) {
    return Array.from(boundValues)
      .map(boundValue => `diff.${boundValue.getName()}`)
      .join(` || `)
  }

}

export class ViewBoundMethodCall extends ViewBoundPropertyAccess {

  constructor (path: string,
               public args: ViewBoundValue[]) {
    super(path)
  }

  public usesPlaceholder (): boolean {
    return this.args.some(isInstance(ViewBoundPlaceholder))
  }

  public resolve (from: FactoryAnalyzer<TemplateNodeValue>): string {
    const methodName = super.resolve(from)
    const args = this.args.map(arg => arg.resolve(from))
    return `${methodName}(${args.join(', ')})`
  }

  public isConstant (): boolean {
    return true
  }

  // just for the type, should really be a generic but this works for now
  public getDefinitionFactory (): ComponentFactoryAnalyzer {
    return super.getDefinitionFactory() as ComponentFactoryAnalyzer
  }

}

export class ViewBoundPlaceholder extends ViewBoundValue {

  public getDefinitionFactory (): FactoryAnalyzer<TemplateNodeValue> {
    return this.getResponsibleFactory()
  }

  public resolve (): string {
    return '__wane__placeholder'
  }

  public isConstant (): boolean {
    return true
  }

}
