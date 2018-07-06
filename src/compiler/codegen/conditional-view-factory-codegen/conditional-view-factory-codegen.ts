import CodeBlockWriter from 'code-block-writer'
import { ConditionalViewFactoryAnalyzer } from '../../analyzer/factory-analyzer/conditional-view-factory-analyzer'
import { BaseFactoryCodegen } from '../base-factory-codegen'
import { FactoryAnalyzer } from '../../analyzer'
import { TemplateNodeValue } from '../../template-nodes/nodes/template-node-value-base'

export class ConditionalViewFactoryCodegen extends BaseFactoryCodegen {

  private generateInitPartialViewMethod (fa: ConditionalViewFactoryAnalyzer): this {
    this.writer
      .writeLine(`__wane__initPartialView() {`)
      .indentBlock(() => {
        this.writer
          .writeLine(`this.__wane__factoryChildren[0] = ${fa.getPartialViewFactoryAnalyzer().getFactoryName()}()`)
          .writeLine(`this.__wane__factoryChildren[0].__wane__factoryParent = this`)
          .writeLine(`this.__wane__factoryChildren[0].__wane__openingCommentOutlet = this.__wane__openingCommentOutlet`)
          .writeLine(`this.__wane__factoryChildren[0].__wane__closingCommentOutlet = this.__wane__closingCommentOutlet`)
          .writeLine(`this.__wane__factoryChildren[0].__wane__init()`)
      })
      .writeLine(`},`)
    return this
  }

  private generateInitMethod (fa: ConditionalViewFactoryAnalyzer): this {
    this.writer
      .writeLine(`__wane__init() {`)
      .indentBlock(() => {
        const path = fa.printPathTo(fa.getFirstScopeBoundaryUpwardsIncludingSelf())

        const [
          openingIndex,
          closingIndex,
        ] = fa.getParent().getIndexesFor(fa.getAnchorViewNode().getValueOrThrow())

        this.writer
          .writeLine(`this.__wane__contextFactory = this${path}`)
          .writeLine(`this.__wane__openingCommentOutlet = this.__wane__factoryParent.__wane__domNodes[${openingIndex}]`)
          .writeLine(`this.__wane__closingCommentOutlet = this.__wane__factoryParent.__wane__domNodes[${closingIndex}]`)
          .writeLine(`this.__wane__factoryChildren = []`)

        fa.getBinding().printInit(this.writer, fa)

        this.writer
          .writeLine(`if (this.__wane__data) {`)
          .indentBlock(() => {
            this.writer.writeLine(`this.__wane__initPartialView()`)
          })
          .writeLine(`}`)
      })
      .writeLine(`},`)
    return this
  }

  protected generateUpdateMethod (fa: ConditionalViewFactoryAnalyzer): this {
    this.writer
      .writeLine(`__wane__update(diff) {`)
      .indentBlock(() => {
        this.writer
          .writeLine(`const prev = this.__wane__prevData`)
          .writeLine(`this.__wane__prevData = this.__wane__data`)
          .writeLine(`if (!prev && !this.__wane__data) return`)
          .writeLine(`if (!prev && this.__wane__data) return this.__wane__initPartialView()`)
          .writeLine(`if (prev && !this.__wane__data) return this.__wane__factoryChildren[0].__wane__destroy()`)
          .writeLine(`this.__wane__factoryChildren[0].__wane__update(diff)`)
      })
      .writeLine(`},`)
    return this
  }

  protected generateDestroyViewMethod (fa: ConditionalViewFactoryAnalyzer): this {
    this.writer
      .writeLine(`__wane__destroy() {`)
      .indentBlock(() => {
        this.writer
          .writeLine(`this.__wane__factoryChildren[0].__wane__destroy()`)
      })
      .writeLine(`},`)
    return this
  }

  private generateFactory (fa: ConditionalViewFactoryAnalyzer): this {
    this.writer
      .writeLine(`export default () => ({`)
      .indentBlock(() => {
        this
          .generateInitPartialViewMethod(fa)
          .generateInitMethod(fa)
          .generateUpdateMethod(fa)
          .generateDestroyViewMethod(fa)
      })
      .writeLine(`})`)
    return this
  }

  public printCode (fa: ConditionalViewFactoryAnalyzer): CodeBlockWriter {
    return this
      .resetWriter()
      .printImports(fa)
      .generateFactory(fa)
      .getWriter()
  }

  public getFactoryFileName (fa: FactoryAnalyzer<TemplateNodeValue>): string {
    return ''
  }

  public getFactoryFileNameWithoutExtension (fa: FactoryAnalyzer<TemplateNodeValue>): string {
    return ''
  }

  public getFactoryName (fa: FactoryAnalyzer<TemplateNodeValue>): string {
    return ''
  }

}
