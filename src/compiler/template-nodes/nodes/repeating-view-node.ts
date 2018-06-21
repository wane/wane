import { TemplateNodeValue } from './template-node-value-base'
import { RepeatingViewBinding } from '../view-bindings'
import CodeBlockWriter from 'code-block-writer'
import * as himalaya from 'himalaya'
import { FactoryAnalyzer } from "../../analyzer";

export class TemplateNodeRepeatingViewValue extends TemplateNodeValue {

  public readonly isPureDom = false

  constructor (protected binding: RepeatingViewBinding,
               originalTemplateNode: himalaya.Node) {
    super([binding], originalTemplateNode)
  }

  private prettyPrint (): string {
    return `${this.binding.iterativeConstantName} of ${this.binding.boundValue.resolve()}`
  }

  public printDomInit (from: FactoryAnalyzer<TemplateNodeValue>): string[] {
    return [
      `util.__wane__createComment('w:for opening ${this.prettyPrint()}')`,
      `util.__wane__createComment('w:for closing ${this.prettyPrint()}')`,
    ]
  }

  public domNodesCount = 2

  public toString (): string {
    return `[Repeating] w:for`
  }

}
