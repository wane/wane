import { BaseCodegen } from '../base-codegen'
import CodeBlockWriter from 'code-block-writer'
import { FactoryAnalyzer } from '../../analyzer'
import { TemplateNodeValue } from '../../template-nodes/nodes/template-node-value-base'

export class BootstrapCodegen extends BaseCodegen {

  public printCode (fa: FactoryAnalyzer<TemplateNodeValue>): CodeBlockWriter {
    const fileName = fa.getFactoryFilename()
    const name = fa.getFactoryName()
    return this
      .resetWriter()
      .getWriter()
      .writeLine(`import ${name} from './${fileName}'`)
      .writeLine(`export default ${name}()`)
  }

}
