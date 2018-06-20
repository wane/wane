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
   * Where the data is defined, meaning where the data is defined.
   * @returns {FactoryAnalyzer<TemplateNodeValue>}
   */
  public getDefinitionFactory (): FactoryAnalyzer<TemplateNodeValue> {
    return this.getResponsibleFactory().getFirstScopeBoundaryUpwardsIncludingSelf()
  }

  /**
   * @deprecated
   */
  public abstract getScopeFactory (): FactoryAnalyzer<TemplateNodeValue>

  public abstract resolve (from?: FactoryAnalyzer<TemplateNodeValue>): string

  public abstract isConstant (): boolean

}

export class ViewBoundConstant extends ViewBoundValue {

  constructor (protected value: string) {
    super()
  }

  public getScopeFactory (): FactoryAnalyzer<TemplateNodeValue> {
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

  public getScopeFactory (): FactoryAnalyzer<TemplateNodeValue> {
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
    const chain = from.printPathTo(this.getScopeFactory())
    return `this${chain}`
  }

  public resolveNameInFactory () {
    const resolvedName = this.getScopeFactory().hasDefinedAndResolvesTo(this.path)
    if (resolvedName == null) {
      throw new Error(`Expected resolved name not to be null.`)
    }
    return `__wane__data.${resolvedName}`
  }

  public resolve (from: FactoryAnalyzer<TemplateNodeValue> = this.getResponsibleFactory()): string {
    const factory = this.resolveFactory(from)
    const name = this.resolveNameInFactory()
    return `${factory}.${name}`
  }

  public isConstant (): boolean {
    // TODO: Statically analyze this
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
               protected args: ViewBoundValue[]) {
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
  public getScopeFactory (): ComponentFactoryAnalyzer {
    return super.getScopeFactory() as ComponentFactoryAnalyzer
  }

}

export class ViewBoundPlaceholder extends ViewBoundValue {

  public getScopeFactory (): FactoryAnalyzer<TemplateNodeValue> {
    return this.getResponsibleFactory()
  }

  public resolve (): string {
    return '__wane__placeholder'
  }

  public isConstant (): boolean {
    return true
  }

}
