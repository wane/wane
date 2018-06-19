import { FactoryAnalyzer } from './base-factory-analyzer'
import { Forest, TreeNode } from '../../utils/tree'
import { TemplateNodeRepeatingViewValue } from '../../template-nodes/nodes/repeating-view-node'
import { PartialViewFactoryAnalyzer } from './partial-view-factory-analyzer'
import { RepeatingViewBinding } from '../../template-nodes/view-bindings'
import { TemplateNodeValue } from '../../template-nodes/nodes/template-node-value-base'
import { ViewBoundPropertyAccess } from '../../template-nodes/view-bound-value'

export class RepeatingViewFactoryAnalyzer extends PartialViewFactoryAnalyzer<TemplateNodeRepeatingViewValue> {

  constructor (
    uniqueId: number,
    parentFactory: FactoryAnalyzer<TemplateNodeValue>,
    anchorViewNode: TreeNode<TemplateNodeRepeatingViewValue>,
    templateDefinition: Forest<TemplateNodeValue>,
  ) {
    super(uniqueId, parentFactory, anchorViewNode, templateDefinition)
  }

  public getBinding (): RepeatingViewBinding {
    const bindings = new Set(this.getAnchorViewNode().getValueOrThrow().viewBindings)
    if (bindings.size != 1) {
      throw new Error(`Expected repeating view node to have exactly one binding.`)
    }
    const [binding] = bindings
    if (!(binding instanceof RepeatingViewBinding)) {
      throw new Error(`Expected RepeatingViewFactory to have a RepeatingViewBinding.`)
    }
    return binding
  }

  public hasDefinedAndResolvesTo (propAccessPath: string): string | null {
    const iterativeConstantName = this.getBinding().iterativeConstantName
    const indexConstantName = this.getBinding().indexConstantName
    const [propName, ...rest] = propAccessPath.split('.')
    if (propName == iterativeConstantName) {
      return `__wane__data`
    }
    if (propAccessPath == indexConstantName) {
      return `__wane__index`
    }
    return null
  }

  public getFactoryName (): string {
    const boundValue = this.getBinding().boundValue as ViewBoundPropertyAccess
    const path = boundValue.getRawPath().replace(/\./g, '-')
    return `RepeatingView_${path}_${this.uniqueId}`
  }

  public toString (): string {
    return `ConditionalViewFactoryAnalyzer#${this.getFactoryName()}`
  }

}
