import { TemplateNodeValue } from "./template-node-value-base";
import { FactoryAnalyzer } from "../../analyzer";
import { TextBinding } from "../view-bindings";
import * as himalaya from "himalaya";

export class TemplateNodeTextValue extends TemplateNodeValue {

  constructor (protected textBinding: TextBinding,
               originalTemplateNode: himalaya.Text) {
    super([textBinding], originalTemplateNode)
  }

  public domNodesCount: number = 1

  public readonly isPureDom: boolean = true;

  public printDomInit (from: FactoryAnalyzer<TemplateNodeValue>): string[] {
    return [
      `util.__wane__createTextNode(${this.textBinding.boundValue.resolve()})`
    ]
  }

  public toString (): string {
    return `[Text] ${this.textBinding.boundValue.resolve()}`
  }

  public getBinding() {
    return this.textBinding
  }

}
