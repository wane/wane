import CodeBlockWriter from 'code-block-writer'
import {WaneCompilerOptions} from '../compile'
import {StyleCodegen} from './style-codegen/style-codegen'
import {ConstantsCodegen} from './constants-codegen'

export abstract class BaseCodegen {

  constructor (
    protected writerOptions: any,
    protected waneCompilerOptions: WaneCompilerOptions,
    public styleCodegen: StyleCodegen,
    public constantsCodegen: ConstantsCodegen,
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
