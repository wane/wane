import { FactoryAnalyzer } from './base-factory-analyzer'
import { TemplateNodePartialViewValue } from '../../template-nodes'
import CodeBlockWriter from 'code-block-writer'
import { TemplateNodeValue } from '../../template-nodes/nodes/template-node-value-base'
import { Forest, TreeNode } from '../../utils/tree'

export class PartialViewFactoryAnalyzer<T extends TemplateNodePartialViewValue> extends FactoryAnalyzer<TemplateNodePartialViewValue> {

  public templateDefinition: Forest<TemplateNodeValue>

  constructor (
    uniqueId: number,
    parentFactory: FactoryAnalyzer<TemplateNodeValue>,
    anchorViewNode: TreeNode<T>,
    templateDefinition: Forest<TemplateNodeValue>,
  ) {
    super(uniqueId, parentFactory, anchorViewNode)
    this.templateDefinition = templateDefinition
  }

  public getFactoryName (): string {
    return ''
  }

  public getPropsBoundToView (): Map<string, string> {
    return undefined
  }

  public hasDefinedAndResolvesTo (propAccessPath: string): string | null {
    return undefined
  }

  public isScopeBoundary (): boolean {
    return false
  }

  public printAssemblingDomNodes (wr: CodeBlockWriter): CodeBlockWriter {
    return wr
      .newLineIfLastNot()
      .writeLine(`util.__wane__insertBefore(this.__wane__closingCommentOutlet, [`)
      .indentBlock(() => this.printAssemblingDomNodesGeneric(wr))
      .writeLine(`])`)
  }

  public printRootDomNodeAssignment (wr: CodeBlockWriter): CodeBlockWriter {
    return undefined
  }

}
