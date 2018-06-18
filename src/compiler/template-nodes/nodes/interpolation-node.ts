import { TemplateNodeValue } from './template-node-value-base'
import CodeBlockWriter from 'code-block-writer'
import { InterpolationBinding } from '../view-bindings'
import * as himalaya from 'himalaya'

export class TemplateNodeInterpolationValue extends TemplateNodeValue {

  public readonly isPureDom = true

  constructor (protected interpolationBinding: InterpolationBinding,
               originalTemplateNode: himalaya.Text) {
    super([interpolationBinding], originalTemplateNode)
  }

  public getBinding (): InterpolationBinding {
    return this.interpolationBinding
  }

  public printDomInit (): string[] {
    return [
      `util.__wane__createTextNode(${this.interpolationBinding.boundValue.resolve()})`,
    ]
  }

  public domNodesCount = 1

  public toString (): string {
    return `[Text] ${this.rawProp()}`
  }

  public rawProp (): string {
    const html = this.originalTemplateNode as himalaya.Text
    return html.content.replace(/\n/g, `\\n`)
  }

}
