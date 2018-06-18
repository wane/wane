import { BaseCodegen } from './base-codegen'
import CodeBlockWriter from 'code-block-writer'
import { HelpersCodegen } from './helpers-codegen/helpers-codegen'

export class DirectiveIfCodegen extends BaseCodegen {

  public printCode (...args: any[]): CodeBlockWriter {
    return this.writer
      .writeLine(`import * as util from './util'`)
      .newLine()

      .writeLine(`export default (view) => ({`)
      .indentBlock(() => {
        this.writer
          .writeLine(`// __wane__data will be set by parent after it's created but before it's initialized`)
          .writeLine(`__wane__view: view,`)

          .writeLine(`__wane__initChild() {`)
          .indentBlock(() => {
            this.writer
              .writeLine(`${HelpersCodegen.NAMES.createFactoryChildren}(this, this.__wane__view())`)
              .writeLine(`this.__wane__factoryChildren[0].__wane__init()`)
          })
          .writeLine(`},`)

          .writeLine(`__wane__init() {`)
          .indentBlock(() => {
            this.writer
              .writeLine(`if (this.__wane__data) {`)
              .indentBlock(() => {
                this.writer.writeLine(`this.__wane__initChild()`)
              })
              .writeLine(`}`)
          })
          .writeLine(`},`)

          .writeLine(`__wane__update(diff) {`)
          .indentBlock(() => {
            this.writer
              .writeLine(`const prev = this.__wane__prevData`)
              .writeLine(`this.prevCondition = this.__wane__data`)
              .writeLine(`if (!prev && !this.__wane__data) return`)
              .writeLine(`if (!prev && this.__wane__data) this.__wane__initChild()`)
              .writeLine(`if (prev && !this.__wane__data) this.__wane__factoryChildren[0].__wane__destroy()`)
              .writeLine(`this.__wane__factoryChildren[0].__wane__update(diff)`)
          })
          .writeLine(`}`)

          .writeLine(`__wane__destroy: util.${HelpersCodegen.NAMES.destroyDirectiveFactory},`)
      })
      .writeLine(`)}`)
  }

}
