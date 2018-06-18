import { WaneDomNode } from './base'
import { TemplateNodeComponentValue } from '../../template-nodes/nodes/component-node'
import { TemplateNodeHtmlValue } from '../../template-nodes/index'

export class WaneTagNode extends WaneDomNode<TemplateNodeComponentValue | TemplateNodeHtmlValue> {

  public tagName: string

  constructor (templateNode: TemplateNodeComponentValue | TemplateNodeHtmlValue, tagName: string) {
    super(templateNode)
    this.tagName = tagName
  }

  public printCreate (): string {
    return `util.__wane__createElement(${this.tagName})`
  }

}
