import { FactoryAnalyzer } from './base-factory-analyzer'
import { Forest, TreeNode } from '../../utils/tree'
import { TemplateNodeRepeatingViewValue } from '../../template-nodes/nodes/repeating-view-node'
import { DirectiveFactoryAnalyzer } from './directive-factory-analyzer'
import { RepeatingViewBinding } from '../../template-nodes/view-bindings'
import { TemplateNodeValue } from '../../template-nodes/nodes/template-node-value-base'
import { ViewBoundPropertyAccess } from '../../template-nodes/view-bound-value'
import { PartialViewFactoryAnalyzer } from './partial-view-factory-analyzer'
import { echoize } from '../../utils/echoize'

export class RepeatingViewFactoryAnalyzer extends DirectiveFactoryAnalyzer<TemplateNodeRepeatingViewValue> {

  constructor (
    uniqueId: number,
    parentFactory: FactoryAnalyzer<TemplateNodeValue>,
    anchorViewNode: TreeNode<TemplateNodeRepeatingViewValue>,
    templateDefinition: Forest<TemplateNodeValue>,
    partialViewFactoryAnalyzer: PartialViewFactoryAnalyzer,
  ) {
    super(uniqueId, parentFactory, anchorViewNode, templateDefinition, partialViewFactoryAnalyzer)
  }

  @echoize()
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

  @echoize()
  public hasDefinedAndResolvesTo (propAccessPath: string): string | null {
    return null
  }

  @echoize()
  public getFactoryName (): string {
    const boundValue = this.getBinding().boundValue as ViewBoundPropertyAccess
    const path = boundValue.getRawPath().replace(/\./g, '-')
    return `RepeatingView_${path}_${this.uniqueId}`
  }

  @echoize()
  public toString (): string {
    return `ConditionalViewFactoryAnalyzer#${this.getFactoryName()}`
  }

  @echoize()
  public getNeighbors (): FactoryAnalyzer<TemplateNodeValue>[] {
    const neighbors: FactoryAnalyzer<TemplateNodeValue>[] = []

    const runtimeParent = this.getParentOrUndefined()
    if (runtimeParent != null) neighbors.push(runtimeParent)

    // cannot reach children (you need a key for that) so we do not include them here

    return neighbors
  }

}
