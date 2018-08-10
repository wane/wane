import { TemplateNodeValue } from './template-node-value-base'
import {
  AttributeBinding,
  ComponentInputBinding,
  ComponentOutputBinding,
  ViewBinding,
} from '../view-bindings'
import { paramCase } from 'change-case'
import * as himalaya from '../../template-parser/html/himalaya'
import { FactoryAnalyzer } from '../../analyzer'
import { and } from './utils'
import { isInstance } from '../../utils/utils'
import { ComponentFactoryAnalyzer } from '../../analyzer/factory-analyzer/component-factory-analyzer'

function getSuperParam (attributeBindings: Iterable<AttributeBinding>,
                        propertyBindings: Iterable<ComponentInputBinding>,
                        eventBinding: Iterable<ComponentOutputBinding>): Iterable<ViewBinding<TemplateNodeValue>> {
  const set = new Set<ViewBinding<TemplateNodeValue>>()
  for (const binding of attributeBindings) {
    set.add(binding)
  }
  for (const binding of propertyBindings) {
    set.add(binding)
  }
  for (const binding of eventBinding) {
    set.add(binding)
  }
  return set
}

export class TemplateNodeComponentValue extends TemplateNodeValue {

  public readonly isPureDom = false

  constructor (protected registeredTagName: string,
               protected attributeBindings: Iterable<AttributeBinding>,
               protected inputBindings: Iterable<ComponentInputBinding>,
               protected outputBindings: Iterable<ComponentOutputBinding>,
               originalTemplateNode: himalaya.NodeElement) {
    super(getSuperParam(attributeBindings, inputBindings, outputBindings), originalTemplateNode)
  }

  // just for the better type
  public getFactoryWhichThisIsAnchorFor (): ComponentFactoryAnalyzer {
    return super.getFactoryWhichThisIsAnchorFor() as ComponentFactoryAnalyzer
  }

  public getRegisteredName (): string {
    return this.registeredTagName
  }

  public getDomTagName (): string {
    const cfa = this.getFactoryWhichThisIsAnchorFor()
    const ca = cfa.componentAnalyzer
    return ca.getDomTagName()
  }

  public getAttributeBindings () {
    return this.attributeBindings
  }

  public getInputBindings () {
    return this.inputBindings
  }

  public getOutputBindings () {
    return this.outputBindings
  }

  public getBinding<V extends ViewBinding<TemplateNodeValue>> (predicate: (input: ViewBinding<TemplateNodeValue>) => input is V): V | undefined {
    const allFound = new Set<V>()
    for (const binding of super.viewBindings) {
      if (predicate(binding)) {
        allFound.add(binding)
      }
    }
    const [first] = allFound
    return first
  }

  public getBindingOrFail<V extends ViewBinding<TemplateNodeValue>> (predicate: (input: ViewBinding<TemplateNodeValue>) => input is V): V {
    const result = this.getBinding(predicate)
    if (result == null) {
      throw new Error(`Cannot find binding for component node "${this.getRegisteredName()}".`)
    }
    return result
  }

  public getAttributeBindingByNameOrFail (name: string): AttributeBinding {
    return this.getBindingOrFail(and(isInstance(AttributeBinding), input => input.getName()))
  }

  public getInputBindingByNameOrFail (name: string): ComponentInputBinding {
    return this.getBindingOrFail(and(
      isInstance(ComponentInputBinding),
      input => input.getName() == name),
    )
  }

  public getOutputBindingByNameOrFail (name: string): ComponentOutputBinding {
    return this.getBindingOrFail(and(
      isInstance(ComponentOutputBinding),
      output => output.getName() == name,
    ))
  }

  public printDomInit (from: FactoryAnalyzer<TemplateNodeValue>): string[] {
    return [
      `util.__wane__createElement('${this.getDomTagName()}')`,
    ]
  }

  public domNodesCount = 1

  public toString (): string {
    return `[Component] <${this.registeredTagName}>`
  }

}
