import { WaneDomNode } from './base'
import { TemplateNodeConditionalViewValue } from '../../template-nodes/nodes/conditional-view-node'
import { TemplateNodeRepeatingViewValue } from '../../template-nodes/nodes/repeating-view-node'

export class WaneCommentNode extends WaneDomNode<TemplateNodeConditionalViewValue | TemplateNodeRepeatingViewValue> {

  public data: string

  constructor (templateNode: TemplateNodeConditionalViewValue | TemplateNodeRepeatingViewValue, data: string = '') {
    super(templateNode)
    this.data = data
  }

  public printCreate (): string {
    return `util.__wane__createComment(${this.data})`
  }

  public printUpdateContent (instanceAccessPath: string, newValue: string): string {
    return `${instanceAccessPath}.data = ${newValue}`
  }

}
