import { WaneDomNode } from './base'
import { TemplateNodeInterpolationValue } from '../../template-nodes'

export class WaneDomNodeText extends WaneDomNode<TemplateNodeInterpolationValue
  | TemplateNodeInterpolationValue> {

  constructor (templateNode: TemplateNodeInterpolationValue
    | TemplateNodeInterpolationValue,
               public content: string) {
    super(templateNode)
  }

  public printCreate (): string {
    return `util.__wane__createTextNode(${this.content})`
  }

  public printUpdate (instanceAccessPath: string, newValue: string): string {
    return `${instanceAccessPath}.data = ${newValue}`
  }

}
