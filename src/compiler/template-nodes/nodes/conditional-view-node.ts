import { TemplateNodeValue } from './template-node-value-base'
import { ConditionalViewBinding } from '../view-bindings'
import * as himalaya from '../../template-parser/html/himalaya'
import { FactoryAnalyzer } from '../../analyzer'

export class TemplateNodeConditionalViewValue extends TemplateNodeValue {

  public readonly isPureDom = false

  constructor (protected binding: ConditionalViewBinding,
               originalTemplateNode: himalaya.NodeElement) {
    super([binding], originalTemplateNode)
  }

  private prettyPrint (): string {
    return `${this.binding.isNegated ? '!' : ''}${this.binding.boundValue.resolve()}`
  }

  public printDomInit (from: FactoryAnalyzer<TemplateNodeValue>): string[] {
    return [
      `util.__wane__createComment('w:if opening ${this.prettyPrint()}')`,
      `util.__wane__createComment('w:if closing ${this.prettyPrint()}')`,
    ]
  }

  public domNodesCount = 2

  public toString (): string {
    return `[Conditional] w:if`
  }

  public getRawCondition (): string {
    return this.binding.getRaw()
  }

}
