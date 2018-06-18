import { TemplateNodeValue } from '../../template-nodes/nodes/template-node-value-base'

export abstract class WaneDomNode<T extends TemplateNodeValue = TemplateNodeValue> {

  protected constructor (protected templateNode: T) {
  }

  public abstract printCreate (): string

  public getTemplateNode (): T {
    return this.templateNode
  }

}

