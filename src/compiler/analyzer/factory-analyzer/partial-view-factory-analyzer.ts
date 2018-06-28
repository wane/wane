import { FactoryAnalyzer } from './base-factory-analyzer'
import { TemplateNodeValue } from '../../template-nodes/nodes/template-node-value-base'
import { Forest } from '../../utils/tree'
import { DirectiveFactoryAnalyzer } from './directive-factory-analyzer'
import CodeBlockWriter from 'code-block-writer'
import { ConditionalViewFactoryAnalyzer } from './conditional-view-factory-analyzer'
import { RepeatingViewFactoryAnalyzer } from './repeating-view-factory-analyzer'

export class PartialViewFactoryAnalyzer extends FactoryAnalyzer<TemplateNodeValue> {

  public get view (): Forest<TemplateNodeValue> {
    return this.getDirectiveFactoryAnalyzer().view
  }

  public getParentOrUndefined (): FactoryAnalyzer<TemplateNodeValue> | undefined {
    return this.getDirectiveFactoryAnalyzer()
  }

  private directiveFactoryAnalyzer: DirectiveFactoryAnalyzer | undefined

  public templateDefinition: Forest<TemplateNodeValue>

  public getPartialViewFactoryAnalyzer () {
    return this
  }

  public getChildrenFactories () {
    return this.getDirectiveFactoryAnalyzer().getChildrenFactories()
  }

  public registerDirectiveFactoryAnalyzer (directiveFactoryAnalyzer: DirectiveFactoryAnalyzer): void {
    if (this.directiveFactoryAnalyzer != null) {
      throw new Error(`PartialViewFactoryAnalyzer ("${this.directiveFactoryAnalyzer.getFactoryName()}") has already been registered to "${this.getFactoryName()}".`)
    }
    this.directiveFactoryAnalyzer = directiveFactoryAnalyzer
  }

  public getDirectiveFactoryAnalyzer (): DirectiveFactoryAnalyzer {
    if (this.directiveFactoryAnalyzer == null) {
      throw new Error(`PartialViewFactoryAnalyzer has not been registered for "${this.getFactoryName()}".`)
    }
    return this.directiveFactoryAnalyzer
  }

  constructor (
    uniqueId: number,
    templateDefinition: Forest<TemplateNodeValue>,
  ) {
    super(uniqueId, undefined, undefined)
    this.templateDefinition = templateDefinition
  }

  getPropsBoundToView (): Map<string, string> {
    return new Map<string, string>()
  }

  hasDefinedAndResolvesTo (propAccessPath: string): string | null {
    let print = false
    if (propAccessPath == 'item.name') {
      print = true
    }
    const directiveFa = this.getDirectiveFactoryAnalyzer()
    if (directiveFa instanceof ConditionalViewFactoryAnalyzer) {
      return null
    } else if (directiveFa instanceof RepeatingViewFactoryAnalyzer) {
      const iterativeConstantName = directiveFa.getBinding().iterativeConstantName
      const indexConstantName = directiveFa.getBinding().indexConstantName
      const [propName, ...rest] = propAccessPath.split('.')
      if (propName == iterativeConstantName) {
        return [`item`, ...rest].join('.')
      }
      if (propAccessPath == indexConstantName) {
        return `index`
      }
      return null
    }
    throw new Error(`Uuuh`)
  }

  isScopeBoundary (): boolean {
    return false
  }

  printAssemblingDomNodes (wr: CodeBlockWriter): CodeBlockWriter {
    return wr
      .newLineIfLastNot()
      .writeLine(`util.__wane__insertBefore(this.__wane__closingCommentOutlet, [`)
      .indentBlock(() => this.printAssemblingDomNodesGeneric(wr))
      .writeLine(`])`)
  }

  printRootDomNodeAssignment (wr: CodeBlockWriter): CodeBlockWriter {
    return wr
  }

  getFactoryName (): string {
    return `PartialView_${this.getDirectiveFactoryAnalyzer().getFactoryName()}_${this.uniqueId}`
  }

  public isHopToParent (to: FactoryAnalyzer<TemplateNodeValue>): boolean {
    return to == this.getDirectiveFactoryAnalyzer()
  }

  public getNeighbors (): FactoryAnalyzer<TemplateNodeValue>[] {
    const runtimeParent = this.getDirectiveFactoryAnalyzer()
    const runtimeChildren = runtimeParent.getChildrenFactories()
    return [runtimeParent, ...runtimeChildren]
  }

  public toString (): string {
    return `ComponentFactoryAnalyzer#${this.getFactoryName()}`
  }

}
