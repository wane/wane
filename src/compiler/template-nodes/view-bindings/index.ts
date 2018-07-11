import {TemplateNodeValue} from '../nodes/template-node-value-base'
import {TemplateNodeHtmlValue, TemplateNodeInterpolationValue} from '..'
import {TemplateNodeComponentValue} from '../nodes/component-node'
import {ViewBoundConstant, ViewBoundMethodCall, ViewBoundPropertyAccess, ViewBoundValue} from '../view-bound-value'
import CodeBlockWriter from 'code-block-writer'
import {TemplateNodeConditionalViewValue} from '../nodes/conditional-view-node'
import {TemplateNodeRepeatingViewValue} from '../nodes/repeating-view-node'
import {FactoryAnalyzer} from '../../analyzer'
import {TemplateNodeTextValue} from "../nodes/text-node"
import {getPropInfoByPropName} from '../../analyzer/utils/prop-info'
import {isInstance} from '../../utils/utils'
import {ComponentFactoryAnalyzer} from '../../analyzer/factory-analyzer/component-factory-analyzer'

export abstract class ViewBinding<NodeType extends TemplateNodeValue> {

  protected _templateNode: NodeType | undefined

  constructor (public readonly boundValue: ViewBoundValue) {
    this.boundValue.registerViewBinding(this)
  }

  public registerTemplateNode (templateNode: NodeType): this {
    if (this._templateNode != null) {
      throw new Error(`You can register a TemplateNode only once.`)
    }
    this._templateNode = templateNode
    return this
  }

  public getTemplateNode (): NodeType {
    if (this._templateNode == null) {
      throw new Error(`Template Node Value not registered to a View Binding.`)
    }
    return this._templateNode
  }

  public abstract printInit (wr: CodeBlockWriter,
                             from: FactoryAnalyzer<TemplateNodeValue>): CodeBlockWriter

  public abstract printUpdate (wr: CodeBlockWriter,
                               from: FactoryAnalyzer<TemplateNodeValue>): CodeBlockWriter

  /**
   * We expect codegen to handle HTML stuff and custom Wane stuff differently.
   * For example, binding (click) to <button> and (toggle) on <item-cmp>.
   *
   * This is done per binding (not per template node) because, fo example, attributes
   * can be applied to Wane components as well as HTML elements.
   *
   * @returns {boolean}
   */
  public abstract isNativeHtml (): boolean

  /**
   * We type check templates. Each of the bindings has an expected type that will be
   * checked against when a concrete value is given.
   */
  public abstract getExpectedType (): string

  /**
   * Used in error reporting. Prints it in such a way that user
   * should recognize it quickly.
   */
  public abstract toString (): string

  /**
   * In a component named Cmp with a "foo" class property, we can have the following template.
   *
   * ```
   * <span>{{ foo }}</span>
   * <w:if bar>{{ foo }} is a nice number</w:if>
   * ```
   *
   * The example above:
   * For the outer foo interpolation, Cmp is both a **responsible factory** and a **definition factory**.
   * For the inner foo interpolation, Cmp only a **definition** factory. Its **responsible factory** is w:if.
   *
   * ```
   * <span>{{ foo }}
   * <w:for foo of foos>{{ foo }}</w:for>
   *
   * The example above:
   * For the outer foo interpolation, Cmp is both a **responsible factory** and a **definition factory**.
   * For the inner foo interpolation, w:for is both **responsible** and **definition**.
   */
  public getResponsibleFactory (): FactoryAnalyzer<TemplateNodeValue> {
    return this.boundValue.getResponsibleFactory()
  }

  // TODO: Isn't this always a component factory?
  public getDefinitionFactory (): FactoryAnalyzer<TemplateNodeValue> {
    return this.boundValue.getDefinitionFactory()
  }

  public getFirstScopeBoundaryUpwardsIncludingSelf (): FactoryAnalyzer<TemplateNodeValue> {
    return this.boundValue.getFirstScopeBoundaryUpwardsIncludingSelf()
  }

}


export class TextBinding extends ViewBinding<TemplateNodeTextValue> {

  constructor (boundValue: ViewBoundConstant) {
    super(boundValue)
  }

  public isNativeHtml (): boolean {
    return true
  }

  public printInit (wr: CodeBlockWriter,
                    from: FactoryAnalyzer<TemplateNodeValue> = this.getResponsibleFactory(),
  ): CodeBlockWriter {
    // Already been initialized when the DOM node was created.
    return wr
  }

  public printUpdate (wr: CodeBlockWriter,
                      from: FactoryAnalyzer<TemplateNodeValue> = this.getResponsibleFactory(),
  ): CodeBlockWriter {
    // Always constant, nothing to update.
    return wr
  }

  public getExpectedType (): string {
    return 'string'
  }

  public toString (): string {
    return `"${this.boundValue.resolve()}"`
  }

}

export class InterpolationBinding extends ViewBinding<TemplateNodeInterpolationValue> {

  public isNativeHtml (): boolean {
    return true
  }

  public printInit (wr: CodeBlockWriter,
                    from: FactoryAnalyzer<TemplateNodeValue>,
  ): CodeBlockWriter {
    // it has already been initialized when the DOM node was created
    return wr
  }

  public printUpdate (wr: CodeBlockWriter,
                      from: FactoryAnalyzer<TemplateNodeValue>,
  ): CodeBlockWriter {
    if (this.boundValue.isConstant()) {
      return wr
    } else {
      // update to DOM is happening in the factory that has this in its view
      const instance = this.getTemplateNode().resolveAccessToSingleDomNode(from)
      return wr.write(`${instance}.data = ${this.boundValue.resolve(from)}`)
    }
  }

  public getExpectedType (): string {
    return 'string'
  }

  public toString (): string {
    const boundValue = this.boundValue
    return `{{ ${boundValue.getRaw()} }}`
  }

}

export class AttributeBinding extends ViewBinding<TemplateNodeHtmlValue> {

  constructor (protected attributeName: string,
               boundValue: ViewBoundValue) {
    super(boundValue)
  }

  public getName () {
    return this.attributeName
  }

  public isNativeHtml (): boolean {
    return true
  }

  public printInit (wr: CodeBlockWriter,
                    from: FactoryAnalyzer<TemplateNodeValue>,
  ): CodeBlockWriter {
    const instance = this.getTemplateNode().resolveAccessToSingleDomNode(from)
    const name = `'${this.attributeName}'`
    const value = this.boundValue.resolve(from)
    return wr.writeLine(`${instance}.setAttribute(${name}, ${value})`)
  }

  public printUpdate (wr: CodeBlockWriter,
                      from: FactoryAnalyzer<TemplateNodeValue>,
  ): CodeBlockWriter {
    return this.printInit(wr, from)
  }

  public getExpectedType (): string {
    return 'string'
  }

  public toString (): string {
    return `[attr.${this.attributeName}]="${this.boundValue.getRaw()}"`
  }

}

export class HtmlElementPropBinding extends ViewBinding<TemplateNodeHtmlValue> {

  constructor (protected propName: string,
               boundValue: ViewBoundValue) {
    super(boundValue)
  }

  public isNativeHtml (): boolean {
    return true
  }

  public printInit (wr: CodeBlockWriter,
                    from: FactoryAnalyzer<TemplateNodeValue>,
  ): CodeBlockWriter {
    const instance = this.getTemplateNode().resolveAccessToSingleDomNode(from)
    return wr.write(`${instance}.${this.propName} = ${this.boundValue.resolve(from)}`)
  }

  public printUpdate (wr: CodeBlockWriter,
                      from: FactoryAnalyzer<TemplateNodeValue>,
  ): CodeBlockWriter {
    const instance = this.getTemplateNode().resolveAccessToSingleDomNode(from)
    return this.printInit(wr, from)
  }

  public getExpectedType (): string {
    const propInfo = getPropInfoByPropName(this.propName)
    if (propInfo.boolean) return 'boolean'
    if (propInfo.numeric || propInfo.positiveNumeric) return 'number'
    return 'string'
  }

  public toString (): string {
    return `[${this.propName}]="${this.boundValue.getRaw()}"`
  }

}

export class HtmlElementEventBinding extends ViewBinding<TemplateNodeHtmlValue> {

  constructor (protected eventName: string,
               public readonly boundValue: ViewBoundMethodCall) {
    super(boundValue)
    boundValue.args.forEach(arg => arg.registerViewBinding(this))
  }

  public isNativeHtml (): boolean {
    return true
  }

  public printInit (wr: CodeBlockWriter,
                    from: FactoryAnalyzer<TemplateNodeValue>,
  ): CodeBlockWriter {
    const instance = this.getTemplateNode().resolveAccessToSingleDomNode(from)
    return wr
      .write(`util.__wane__addEventListener(${instance}, '${this.eventName}', (`)
      .conditionalWrite(this.boundValue.usesPlaceholder(), `__wane__placeholder`)
      .write(`) => {`)
      .newLine()
      .indentBlock(() => {
        const path = from.printPathTo(this.getDefinitionFactory())
        wr.writeLine(`${path}.${this.boundValue.resolve(from)}`)

        const factories = this.boundValue.getDefinitionFactory()
          .getFactoriesAffectedByCalling(this.boundValue.getName())
        for (const factory of factories) {
          const pathToAncestor: string = from.printPathTo(factory)
          wr.writeLine(`${pathToAncestor}.__wane__update()`)
        }
      })
      .write(`})`)
  }

  public printUpdate (wr: CodeBlockWriter,
                      from: FactoryAnalyzer<TemplateNodeValue>,
  ): CodeBlockWriter {
    return wr
  }

  // TODO: add type info for events
  public getExpectedType (): string {
    return 'any'
  }

  public toString (): string {
    return `(${this.eventName})="${this.boundValue.getRaw()}"`
  }

}

export class ComponentInputBinding extends ViewBinding<TemplateNodeComponentValue> {

  constructor (protected inputName: string,
               boundValue: ViewBoundValue) {
    super(boundValue)
  }

  public getName (): string {
    return this.inputName
  }

  public isNativeHtml (): boolean {
    return false
  }

  public printInit (wr: CodeBlockWriter,
                    from: FactoryAnalyzer<TemplateNodeValue>,
  ): CodeBlockWriter {
    return wr.write(`this.__wane__data.${this.inputName} = ${this.boundValue.resolve(from)}`)
  }

  public printUpdate (wr: CodeBlockWriter,
                      from: FactoryAnalyzer<TemplateNodeValue>,
  ): CodeBlockWriter {
    const childFactory = this.getTemplateNode().getFactoryWhichThisIsAnchorFor()
    const path = from.printPathTo(childFactory)
    return wr.write(`${path}.__wane__data.${this.inputName} = ${this.boundValue.resolve(from)}`)
  }

  public getExpectedType (): string {
    const inputName = this.getName()
    const componentFa = this.getTemplateNode().getFactoryWhichThisIsAnchorFor()

    // TODO: when is this not true?
    if (isInstance(ComponentFactoryAnalyzer)(componentFa)) {
      const componentAnalyzer = componentFa.componentAnalyzer
      const inputType = componentAnalyzer.getPropOrGetterType(inputName)
      return inputType.getText()
    } else {
      return 'any'
    }
  }

  public toString (): string {
    return `TODO`
  }

}

export class ComponentOutputBinding extends ViewBinding<TemplateNodeComponentValue> {

  constructor (protected outputName: string,
               public readonly boundValue: ViewBoundMethodCall) {
    super(boundValue)
  }

  public getName (): string {
    return this.outputName
  }

  public isNativeHtml (): boolean {
    return false
  }

  public printInit (wr: CodeBlockWriter,
                    from: FactoryAnalyzer<TemplateNodeValue>,
  ): CodeBlockWriter {
    return wr
      .write(`this.__wane__data.${this.outputName} = (`)
      .conditionalWrite(this.boundValue.usesPlaceholder(), `__wane__placeholder`)
      .write(`) => {`)
      .newLine()
      .indentBlock(() => {
        const path = from.printPathTo(this.getDefinitionFactory())
        wr.writeLine(`${path}.${this.boundValue.resolve(from)}`)
      })
      .write(`}`)
  }

  public printUpdate (wr: CodeBlockWriter): CodeBlockWriter {
    return wr
  }

  // TODO: type arguments
  public getExpectedType (): string {
    return 'any'
  }

  public toString (): string {
    return 'TODO'
  }

}

export class ConditionalViewBinding extends ViewBinding<TemplateNodeConditionalViewValue> {

  constructor (boundValue: ViewBoundPropertyAccess | ViewBoundConstant,
               public isNegated: boolean) {
    super(boundValue)
  }

  public isNativeHtml (): boolean {
    return false
  }

  public printInit (wr: CodeBlockWriter,
                    from: FactoryAnalyzer<TemplateNodeValue>,
  ): CodeBlockWriter {
    return wr.write(`this.__wane__data = this.__wane__prevData = `)
      .conditionalWrite(this.isNegated, `!`)
      .write(this.boundValue.resolve(from))
  }

  public printUpdate (wr: CodeBlockWriter,
                      from: FactoryAnalyzer<TemplateNodeValue>,
  ): CodeBlockWriter {
    const factoryChild = this.getTemplateNode().getFactoryWhichThisIsAnchorFor()
    const path = from.printPathTo(factoryChild)
    return wr.write(`${path}.__wane__data = `)
      .conditionalWrite(this.isNegated, `!`)
      .write(this.boundValue.resolve(from))
  }

  public getRaw (): string {
    const boundValue = this.boundValue as ViewBoundPropertyAccess
    return boundValue.getRaw()
  }

  public getExpectedType (): string {
    return 'boolean'
  }

  public toString (): string {
    return 'TODO'
  }

}

export class RepeatingViewBinding extends ViewBinding<TemplateNodeRepeatingViewValue> {

  constructor (boundValue: ViewBoundValue,
               public iterativeConstantName: string,
               public indexConstantName: string | undefined,
               public keyAccessorPath: string | undefined) {
    super(boundValue)
  }

  public isNativeHtml (): boolean {
    return false
  }

  public printInit (wr: CodeBlockWriter,
                    from: FactoryAnalyzer<TemplateNodeValue>,
  ): CodeBlockWriter {
    const instance = from.printPathTo(this.getResponsibleFactory())
    return wr.write(`${instance}.__wane__data = ${this.boundValue.resolve(from)}`)
  }

  public printUpdate (wr: CodeBlockWriter,
                      from: FactoryAnalyzer<TemplateNodeValue>,
  ): CodeBlockWriter {
    const factoryChild = this.getTemplateNode().getFactoryWhichThisIsAnchorFor()
    const instance = from.printPathTo(factoryChild)
    return wr.write(`${instance}.__wane__data = ${this.boundValue.resolve(from)}`)
  }

  public getKeyFunction (): string {
    return this.keyAccessorPath == null ? `item => item` : `item => item.${this.keyAccessorPath}`
  }

  public getExpectedType (): string {
    return 'Array<any>'
  }

  public toString (): string {
    return 'TODO'
  }

}
