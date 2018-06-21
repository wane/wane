import { FactoryAnalyzer } from './base-factory-analyzer'
import { Forest, TreeNode } from '../../utils/tree'
import { TemplateNodeRepeatingViewValue } from '../../template-nodes/nodes/repeating-view-node'
import { DirectiveFactoryAnalyzer } from './directive-factory-analyzer'
import { RepeatingViewBinding } from '../../template-nodes/view-bindings'
import { TemplateNodeValue } from '../../template-nodes/nodes/template-node-value-base'
import { ViewBoundPropertyAccess } from '../../template-nodes/view-bound-value'
import { printTreePath } from '../../utils/graph'
import { PartialViewFactoryAnalyzer } from "./partial-view-factory-analyzer";
import { TemplateNodeConditionalViewValue } from "../../template-nodes/nodes/conditional-view-node";

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
      return [`item`, ...rest].join('.')
    }
    if (propAccessPath == indexConstantName) {
      return `index`
    }
    return null
  }

  public printPathTo (fa: FactoryAnalyzer<TemplateNodeValue>): string {
    const isHopToParent = (from: FactoryAnalyzer<TemplateNodeValue>, to: FactoryAnalyzer<TemplateNodeValue>) =>
      from.getParentOrUndefined() == to
    const printHopToParent = (from: FactoryAnalyzer<TemplateNodeValue>, to: FactoryAnalyzer<TemplateNodeValue>, isStartingHop: boolean, isEndingHop: boolean) => {
      return from.printHopToParent(isStartingHop, isEndingHop)
    }
    const printHopToChild = (from: FactoryAnalyzer<TemplateNodeValue>, to: FactoryAnalyzer<TemplateNodeValue>) =>
      `__wane__factoryChildren[${to.getFactoryIndexAsChild()}`
    const path = this.getPathTo(fa)
    return printTreePath(isHopToParent, printHopToParent, printHopToChild, path)
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
