import { FactoryAnalyzer } from "./base-factory-analyzer";
import { TemplateNodeValue } from "../../template-nodes/nodes/template-node-value-base";
import { Forest } from "../../utils/tree";
import { DirectiveFactoryAnalyzer } from "./directive-factory-analyzer";
import CodeBlockWriter from "code-block-writer";

export class PartialViewFactoryAnalyzer extends FactoryAnalyzer<TemplateNodeValue> {

  public get view(): Forest<TemplateNodeValue> {
    return this.getDirectiveFactoryAnalyzer().view
  }

  private directiveFactoryAnalyzer: DirectiveFactoryAnalyzer | undefined

  public templateDefinition: Forest<TemplateNodeValue>;

  public getPartialViewFactoryAnalyzer () {
    return this
  }

  public getChildrenFactories() {
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
    parentFactory: FactoryAnalyzer<TemplateNodeValue>,
    templateDefinition: Forest<TemplateNodeValue>,
  ) {
    super(uniqueId, parentFactory, undefined)
    this.templateDefinition = templateDefinition
  }

  getPropsBoundToView (): Map<string, string> {
    return new Map<string, string>()
  }

  hasDefinedAndResolvesTo (propAccessPath: string): string | null {
    // Partial views are not scopes to anything
    return null
  }

  isScopeBoundary (): boolean {
    return false;
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
    return `PartialView_${this.uniqueId}`;
  }


}
