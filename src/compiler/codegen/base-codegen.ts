import CodeBlockWriter from 'code-block-writer'
import { WaneCompilerOptions } from '../compile'

export abstract class BaseCodegen {

  constructor (
    protected writerOptions: any,
    protected waneCompilerOptions: WaneCompilerOptions,
  ) {
  }

  public abstract printCode (...args: any[]): CodeBlockWriter

  protected writer!: CodeBlockWriter

  protected resetWriter (): this {
    this.writer = new CodeBlockWriter(this.writerOptions)
    return this
  }

  protected getWriter (): CodeBlockWriter {
    return this.writer
  }

}
