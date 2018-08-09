import { TemplateNodeValue } from './template-node-value-base'
import { InterpolationBinding } from '../view-bindings'
import * as himalaya from '../../template-parser/html/himalaya'
import { FactoryAnalyzer } from '../../analyzer'
import { ViewBoundPropertyAccess } from '../view-bound-value'

export class TemplateNodeInterpolationValue extends TemplateNodeValue {

  public readonly isPureDom = true

  constructor (protected interpolationBinding: InterpolationBinding,
               originalTemplateNode: himalaya.NodeText) {
    super([interpolationBinding], originalTemplateNode)
  }

  public getBinding (): InterpolationBinding {
    return this.interpolationBinding
  }

  public printDomInit (from: FactoryAnalyzer<TemplateNodeValue>): string[] {
    return [
      `util.__wane__createTextNode(${this.interpolationBinding.boundValue.resolve(from)})`,
    ]
  }

  public domNodesCount = 1

  public toString (): string {
    return `[Text] ${this.rawContent()}`
  }

  public rawContent (): string {
    const boundValue = this.interpolationBinding.boundValue
    if (boundValue.isConstant()) {
      return boundValue.resolve()
    } else {
      return (boundValue as ViewBoundPropertyAccess).getRawPath()
    }
  }

}
