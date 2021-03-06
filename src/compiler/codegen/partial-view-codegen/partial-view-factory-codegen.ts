import { BaseFactoryCodegen } from '../base-factory-codegen'
import { FactoryAnalyzer } from '../../analyzer'
import { TemplateNodeValue } from '../../template-nodes/nodes/template-node-value-base'
import CodeBlockWriter from 'code-block-writer'
import { PartialViewFactoryAnalyzer } from '../../analyzer/factory-analyzer/partial-view-factory-analyzer'
import { ConditionalViewFactoryAnalyzer } from '../../analyzer/factory-analyzer/conditional-view-factory-analyzer'
import { RepeatingViewFactoryAnalyzer } from '../../analyzer/factory-analyzer/repeating-view-factory-analyzer'

export class PartialViewFactoryCodegen extends BaseFactoryCodegen {

  private isConditionalPartial (fa: PartialViewFactoryAnalyzer) {
    return fa.getDirectiveFactoryAnalyzer() instanceof ConditionalViewFactoryAnalyzer
  }

  private isRepeatingPartial (fa: PartialViewFactoryAnalyzer) {
    return fa.getDirectiveFactoryAnalyzer() instanceof RepeatingViewFactoryAnalyzer
  }

  public printCode (fa: PartialViewFactoryAnalyzer): CodeBlockWriter {
    this.resetWriter()
      .printImports(fa)

    this.writer
      .writeLine(`export default () => ({`)

    if (this.isRepeatingPartial(fa)) {
      this.writer
        .writeLine(`__wane__prevData: {},`)
    }

    this.writer
      .writeLine(`__wane__init() {`)
      .indentBlock(() => {
        this
          .printDomNodesRegistration(fa)
          .printAssemblingDomNodes(fa)
          .printAssembleFactoryChildren(fa)
          .printDomPropsInit(fa)
          .printStylesEncapsulationAttributes(fa)
      })
      .writeLine(`},`)

    if (this.isRepeatingPartial(fa)) {
      this.generateDiffMethod(fa)
    }

    this.generateUpdateViewMethod(fa, `__wane__update`, false, this.isRepeatingPartial(fa))

    this.writer
      .writeLine(`__wane__destroy() {`)
      .indentBlock(() => {
        this.writer
          .writeLine(`this.__wane__factoryChildren.forEach(child => child.__wane__destroy())`)
          .writeLine(`let node = this.__wane__openingCommentOutlet.nextSibling`)
          .writeLine(`while (node != this.__wane__closingCommentOutlet) {`)
          .indentBlock(() => {
            this.writer
              .writeLine(`const nextNode = node.nextSibling`)
              .writeLine(`node.remove()`)
              .writeLine(`node = nextNode`)
          })
          .writeLine(`}`)
      })
      .writeLine(`},`)

      .writeLine(`})`) // end

    return this.writer
  }

  // TODO: Do we even need this stuff below?

  public getFactoryFileName (fa: FactoryAnalyzer<TemplateNodeValue>): string {
    return fa.getFactoryFilenameWithExtension()
  }

  public getFactoryFileNameWithoutExtension (fa: FactoryAnalyzer<TemplateNodeValue>): string {
    return fa.getFactoryFilename()
  }

  public getFactoryName (fa: FactoryAnalyzer<TemplateNodeValue>): string {
    return fa.getFactoryName()
  }

}
