import { TemplateNodeValue } from './template-node-value-base'
import { ConditionalViewBinding } from '../view-bindings'
import CodeBlockWriter from 'code-block-writer'
import * as himalaya from 'himalaya'

export class TemplateNodeConditionalViewValue extends TemplateNodeValue {

  public readonly isPureDom = false

  constructor (protected binding: ConditionalViewBinding,
               originalTemplateNode: himalaya.Element) {
    super([binding], originalTemplateNode)
  }

  private prettyPrint (): string {
    return `${this.binding.isNegated ? '!' : ''}${this.binding.boundValue.resolve()}`
  }

  public printDomInit (): string[] {
    return [
      `util.__wane__createComment('w:if opening ${this.prettyPrint()}')`,
      `util.__wane__createComment('w:if closing ${this.prettyPrint()}')`,
    ]
  }

  public domNodesCount = 2

  public toString (): string {
    return `[Conditional] w:if`
  }

  public getRawCondition(): string {
    return this.binding.getRaw()
  }

}
