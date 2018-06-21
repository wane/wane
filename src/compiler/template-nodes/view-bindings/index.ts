import { TemplateNodeValue } from '../nodes/template-node-value-base'
import { TemplateNodeHtmlValue, TemplateNodeInterpolationValue } from '..'
import { TemplateNodeComponentValue } from '../nodes/component-node'
import { ViewBoundConstant, ViewBoundMethodCall, ViewBoundPropertyAccess, ViewBoundValue } from '../view-bound-value'
import CodeBlockWriter from 'code-block-writer'
import { TemplateNodeConditionalViewValue } from '../nodes/conditional-view-node'
import { TemplateNodeRepeatingViewValue } from '../nodes/repeating-view-node'
import { FactoryAnalyzer } from '../../analyzer'

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
                             instance: string,
                             from?: FactoryAnalyzer<TemplateNodeValue>): CodeBlockWriter

  public abstract printUpdate (wr: CodeBlockWriter,
                               instance: string,
                               from?: FactoryAnalyzer<TemplateNodeValue>): CodeBlockWriter

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
   * In a component named Cmp with a "foo" class property, we can have the following template.
   *
   * ```
   * <span>{{ foo }}</span>
   * <w:if bar>{{ foo }} is a nice number</w:if>
   * ```
   *
   * For the outer foo interpolation, Cmp is both a **responsible factory** and a **definition factory**.
   * For the inner foo interpolation, Cmp only a **definition** factory. Its **responsible factory** is w:if.
   */
  public getResponsibleFactory (): FactoryAnalyzer<TemplateNodeValue> {
    return this.boundValue.getResponsibleFactory()
  }

  public getDefinitionFactory (): FactoryAnalyzer<TemplateNodeValue> {
    return this.boundValue.getDefinitionFactory()
  }

}

export class InterpolationBinding extends ViewBinding<TemplateNodeInterpolationValue> {

  public isNativeHtml (): boolean {
    return true
  }

  public printInit (wr: CodeBlockWriter,
                    instance: string,
                    from: FactoryAnalyzer<TemplateNodeValue> = this.getResponsibleFactory(),
  ): CodeBlockWriter {
    // it has already been initialized when the DOM node was created
    return wr
  }

  public printUpdate (wr: CodeBlockWriter,
                      instance: string,
                      from: FactoryAnalyzer<TemplateNodeValue> = this.getResponsibleFactory(),
  ): CodeBlockWriter {
    if (this.boundValue.isConstant()) {
      return wr
    } else {
      // update to DOM is happening in the factory that has this in its view
      return wr.write(`${instance}.data = ${this.boundValue.resolve(from)}`)
    }
  }

}

export class AttributeBinding extends ViewBinding<TemplateNodeHtmlValue> {

  constructor (protected attributeName: string,
               boundValue: ViewBoundValue) {
    super(boundValue)
  }

  public isNativeHtml (): boolean {
    return true
  }

  public printInit (wr: CodeBlockWriter,
                    instance: string,
                    from: FactoryAnalyzer<TemplateNodeValue> = this.getResponsibleFactory(),
  ): CodeBlockWriter {
    return wr.write(`${instance}.setAttribute('${this.attributeName}'`)
      .write(`, `)
      .write(`${this.boundValue.resolve(from)})`)
      .newLine()
  }

  public printUpdate (wr: CodeBlockWriter,
                      instance: string,
                      from: FactoryAnalyzer<TemplateNodeValue> = this.getResponsibleFactory(),
  ): CodeBlockWriter {
    return this.printInit(wr, instance, from)
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
                    instance: string,
                    from: FactoryAnalyzer<TemplateNodeValue> = this.getResponsibleFactory(),
  ): CodeBlockWriter {
    return wr.write(`${instance}.${this.propName} = ${this.boundValue.resolve(from)}`)
  }

  public printUpdate (wr: CodeBlockWriter,
                      instance: string,
                      from: FactoryAnalyzer<TemplateNodeValue> = this.getResponsibleFactory(),
  ): CodeBlockWriter {
    return this.printInit(wr, instance)
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
                    instance: string,
                    from: FactoryAnalyzer<TemplateNodeValue> = this.getResponsibleFactory(),
  ): CodeBlockWriter {
    console.log(`start === === ===`)
    return wr
      .write(`util.__wane__addEventListener(${instance}, '${this.eventName}', (`)
      .conditionalWrite(this.boundValue.usesPlaceholder(), `__wane__placeholder`)
      .write(`) => {`)
      .newLine()
      .indentBlock(() => {
        wr.writeLine(this.boundValue.resolve(from))
        const factories = this.boundValue.getScopeFactory()
          .getFactoriesAffectedByCalling(this.boundValue.getName())
        for (const factory of factories) {
          const pathToAncestor: string = from.printPathTo(factory)
          wr.writeLine(`this${pathToAncestor}.__wane__update()`)
        }
      })
      .indentBlock(() => {
        console.log(`end === === ===`)
      })
      .write(`})`)
  }

  public printUpdate (wr: CodeBlockWriter,
                      instance: string,
                      from?: FactoryAnalyzer<TemplateNodeValue>,
  ): CodeBlockWriter {
    return wr
  }

}

export class ComponentInputBinding extends ViewBinding<TemplateNodeComponentValue> {

  constructor (protected inputName: string,
               boundValue: ViewBoundValue) {
    super(boundValue)
  }

  public isNativeHtml (): boolean {
    return false
  }

  public printInit (wr: CodeBlockWriter,
                    instance: string,
                    from: FactoryAnalyzer<TemplateNodeValue> = this.getResponsibleFactory(),
  ): CodeBlockWriter {
    return wr.write(`${instance}.${this.inputName} = ${this.boundValue.resolve(from)}`)
  }

  public printUpdate (wr: CodeBlockWriter,
                      instance: string,
                      from: FactoryAnalyzer<TemplateNodeValue> = this.getResponsibleFactory(),
  ): CodeBlockWriter {
    return wr.write(`${instance}.${this.inputName} = ${this.boundValue.resolve(from)}`)
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
                    instance: string,
                    from: FactoryAnalyzer<TemplateNodeValue> = this.getResponsibleFactory(),
  ): CodeBlockWriter {
    return wr
      .write(`${instance}.${this.outputName} = (`)
      .conditionalWrite(this.boundValue.usesPlaceholder(), `__wane__placeholder`)
      .write(`) => {`)
      .newLine()
      .indentBlock(() => {
        wr.writeLine(this.boundValue.resolve(from))
      })
      .write(`}`)
  }

  public printUpdate (wr: CodeBlockWriter, instance: string): CodeBlockWriter {
    return wr
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
                    instance: string,
                    from: FactoryAnalyzer<TemplateNodeValue> = this.getResponsibleFactory(),
  ): CodeBlockWriter {
    return wr.write(`${instance}.__wane__data = ${instance}.__wane__prevData = `)
      .conditionalWrite(this.isNegated, `!`)
      .write(this.boundValue.resolve(from))
  }

  public printUpdate (wr: CodeBlockWriter,
                      instance: string,
                      from: FactoryAnalyzer<TemplateNodeValue> = this.getResponsibleFactory(),
  ): CodeBlockWriter {
    return wr.write(`${instance} = `)
      .conditionalWrite(this.isNegated, `!`)
      .write(this.boundValue.resolve(from))
  }

  public getRaw (): string {
    const boundValue = this.boundValue as ViewBoundPropertyAccess
    return boundValue.getRawPath()
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
                    instance: string,
                    from: FactoryAnalyzer<TemplateNodeValue> = this.getResponsibleFactory(),
  ): CodeBlockWriter {
    return wr.write(`${instance}.__wane__data = ${this.boundValue.resolve(from)}`)
  }

  public printUpdate (wr: CodeBlockWriter,
                      instance: string,
                      from: FactoryAnalyzer<TemplateNodeValue> = this.getResponsibleFactory(),
  ): CodeBlockWriter {
    return wr.write(`${instance}.__wane__data = ${this.boundValue.resolve(from)}`)
  }

}
