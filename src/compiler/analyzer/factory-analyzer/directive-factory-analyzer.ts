import { FactoryAnalyzer } from './base-factory-analyzer'
import {
  TemplateNodeHtmlValue,
  TemplateNodeInterpolationValue,
  TemplateNodePartialViewValue,
} from '../../template-nodes'
import { Forest, TreeNode } from '../../utils/tree'
import { TemplateNodeConditionalViewValue } from '../../template-nodes/nodes/conditional-view-node'
import { TemplateNodeRepeatingViewValue } from '../../template-nodes/nodes/repeating-view-node'
import { ViewBinding } from '../../template-nodes/view-bindings'
import { TemplateNodeValue } from '../../template-nodes/nodes/template-node-value-base'
import CodeBlockWriter from 'code-block-writer'
import { PartialViewFactoryAnalyzer } from "./partial-view-factory-analyzer";

export abstract class DirectiveFactoryAnalyzer<T extends TemplateNodePartialViewValue = TemplateNodePartialViewValue> extends FactoryAnalyzer<T> {

  public templateDefinition: Forest<TemplateNodeValue>

  private partialViewFa: PartialViewFactoryAnalyzer | undefined

  public getPartialViewFactoryAnalyzer (): PartialViewFactoryAnalyzer {
    if (this.partialViewFa == null) {
      throw new Error(`No PartialViewFactoryAnalyzer found for "${this.getFactoryName()}".`)
    }
    return this.partialViewFa
  }

  constructor (
    uniqueId: number,
    parentFactory: FactoryAnalyzer<TemplateNodeValue>,
    anchorViewNode: TreeNode<T>,
    templateDefinition: Forest<TemplateNodeValue>,
    partialViewFactoryAnalyzer: PartialViewFactoryAnalyzer,
  ) {
    super(uniqueId, parentFactory, anchorViewNode)
    this.templateDefinition = templateDefinition
    this.partialViewFa = partialViewFactoryAnalyzer
    this.partialViewFa.registerDirectiveFactoryAnalyzer(this)
  }

  public isScopeBoundary (): boolean {
    return false
  }

  private _getNamesOfPropsToWatch (node: TreeNode<TemplateNodeValue>, result: Set<ViewBinding<TemplateNodeValue>>): void {
    const bindings = node.getValueOrThrow().viewBindings
    for (const binding of bindings) {
      result.add(binding)
    }
    // TODO: OOPify this. What are we ACTUALLY asking in this condition?
    if (node.getValueOrThrow() instanceof TemplateNodeConditionalViewValue || node.getValueOrThrow() instanceof TemplateNodeRepeatingViewValue) {
      const factory = this.children.get(node)! as DirectiveFactoryAnalyzer
      factory.getBindingsToWatch().forEach(prop => result.add(prop))
    } else if (node.getValueOrThrow() instanceof TemplateNodeHtmlValue || node.getValueOrThrow() instanceof TemplateNodeInterpolationValue) {
      node.getChildren().forEach(child => {
        this._getNamesOfPropsToWatch(child, result)
      })
    }
  }

  public getBindingsToWatch (): Set<ViewBinding<TemplateNodeValue>> {
    const result = new Set<ViewBinding<TemplateNodeValue>>()
    this.view.forEach((node: TreeNode<TemplateNodeValue>) => {
      this._getNamesOfPropsToWatch(node, result)
    })
    return result
  }

  public getBindingsWhichUseViewScope (): Set<ViewBinding<TemplateNodeValue>> {
    const result = new Set<ViewBinding<TemplateNodeValue>>()
    for (const selfBinding of this.getSelfBindings()) {
      result.add(selfBinding)
    }
    for (const domBinding of this.getHtmlNativeDomBindings()) {
      result.add(domBinding)
    }
    return result
  }

  public printAssemblingDomNodes (wr: CodeBlockWriter): CodeBlockWriter {
    return wr
  }

  public printRootDomNodeAssignment (wr: CodeBlockWriter): CodeBlockWriter {
    const opening = `this.__wane__openingCommentOutlet`
    const closing = `this.__wane__closingCommentOutlet`
    const indexes = this.getParent().getIndexesFor(this.getAnchorViewNode().getValueOrThrow())
    return wr
      .writeLine(`${opening} = this.__wane__factoryParent.__wane__domNodes[${indexes[0]}]`)
      .writeLine(`${closing} = this.__wane__factoryParent.__wane__domNodes[${indexes[1]}]`)
  }

  public getPropsBoundToView (): Map<string, string> {
    return new Map<string, string>()
  }

}
