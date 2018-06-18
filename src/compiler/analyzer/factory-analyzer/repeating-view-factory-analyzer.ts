import { FactoryAnalyzer } from './base-factory-analyzer'
import { Forest, TreeNode } from '../../utils/tree'
import { TemplateNodeRepeatingViewValue } from '../../template-nodes/nodes/repeating-view-node'
import { PartialViewFactoryAnalyzer } from './partial-view-factory-analyzer'
import { RepeatingViewBinding } from '../../template-nodes/view-bindings'
import { TemplateNodeValue } from '../../template-nodes/nodes/template-node-value-base'

export class RepeatingViewFactoryAnalyzer extends PartialViewFactoryAnalyzer<TemplateNodeRepeatingViewValue> {

  // public view!: Forest<TemplateNodeValue>
  // public templateDefinition: Forest<TemplateNodeValue>

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

  // public getIterativeConstantName (): string {
  //   return this.getBinding().iterativeConstantName
  // }
  //
  // public getIterativeIndexName (): string | undefined {
  //   return this.getBinding().indexConstantName
  // }

  public hasDefined (propAccessPath: string): boolean {
    const iterativeConstantName = this.getBinding().iterativeConstantName
    const indexConstantName = this.getBinding().indexConstantName
    const [propName, ...rest] = propAccessPath.split('.')
    return propName == iterativeConstantName || propAccessPath == indexConstantName
  }

  public getFactoryName (): string {
    return ''
  }

}
