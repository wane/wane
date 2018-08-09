import { TemplateNodeValue } from './template-node-value-base'
import {
  AttributeBinding,
  HtmlElementEventBinding,
  HtmlElementPropBinding,
  ViewBinding,
} from '../view-bindings'
import * as himalaya from '../../template-parser/html/himalaya'
import { FactoryAnalyzer } from '../../analyzer'

function getSuperParam (attributeBindings: Iterable<AttributeBinding>,
                        propertyBindings: Iterable<HtmlElementPropBinding>,
                        eventBinding: Iterable<HtmlElementEventBinding>): Iterable<ViewBinding<TemplateNodeValue>> {
  return [...attributeBindings, ...propertyBindings, ...eventBinding]
}

export class TemplateNodeHtmlValue extends TemplateNodeValue {

  public readonly isPureDom = true

  constructor (protected tagName: string,
               protected attributeBindings: Iterable<AttributeBinding>,
               protected propertyBindings: Iterable<HtmlElementPropBinding>,
               protected eventBinding: Iterable<HtmlElementEventBinding>,
               originalTemplateNode: himalaya.NodeElement) {
    super(getSuperParam(attributeBindings, propertyBindings, eventBinding), originalTemplateNode)
  }

  public printDomInit (fa: FactoryAnalyzer<TemplateNodeValue>): string[] {
    return [
      `util.__wane__createElement('${this.tagName}')`,
    ]
  }

  public domNodesCount = 1

  public toString (): string {
    return `[Html] <${this.tagName}>`
  }

}
