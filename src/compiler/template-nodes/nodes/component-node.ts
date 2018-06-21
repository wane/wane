import { TemplateNodeValue } from './template-node-value-base'
import { AttributeBinding, ComponentInputBinding, ComponentOutputBinding, ViewBinding } from '../view-bindings'
import iterare from 'iterare'
import CodeBlockWriter from 'code-block-writer'
import { pascal } from 'change-case'
import * as himalaya from 'himalaya'
import { FactoryAnalyzer } from "../../analyzer";

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

  constructor (protected tagName: string,
               protected attributeBindings: Iterable<AttributeBinding>,
               protected inputBindings: Iterable<ComponentInputBinding>,
               protected outputBindings: Iterable<ComponentOutputBinding>,
               originalTemplateNode: himalaya.Element) {
    super(getSuperParam(attributeBindings, inputBindings, outputBindings), originalTemplateNode)
  }

  public getTagName (): string {
    return this.tagName
  }

  public getComponentClassName (): string {
    return pascal(this.tagName)
  }

  public getAttributeBindings() {
    return this.attributeBindings
  }

  public getInputBindings() {
    return this.inputBindings
  }

  public getOutputBindings() {
    return this.outputBindings
  }

  public printDomInit (from: FactoryAnalyzer<TemplateNodeValue>): string[] {
    return [
      `util.__wane__createElement('${this.tagName}')`,
    ]
  }

  public domNodesCount = 1

  public toString (): string {
    return `[Component] <${this.tagName}>`
  }

}
