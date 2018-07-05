import CodeBlockWriter from 'code-block-writer'
import {ComponentFactoryAnalyzer} from '../../analyzer/factory-analyzer/component-factory-analyzer'
import {paramCase} from 'change-case'
import {BaseFactoryCodegen} from '../base-factory-codegen'
import * as path from 'path'
import {or} from '../../template-nodes/nodes/utils'
import {isInstance} from '../../utils/utils'
import {TemplateNodeHtmlValue} from '../../template-nodes'
import {TemplateNodeComponentValue} from '../../template-nodes/nodes/component-node'

export class ComponentFactoryCodegen extends BaseFactoryCodegen {

  public names = {
    fParent: `__wane__factoryParent`,
    fChildren: `__wane__factoryChildren`,
    data: `__wane__data`,
    prevData: `__wane__prevData`,
    root: `__wane__root`,
    domNodes: `__wane__domNodes`,
    init: `__wane__init`,
    diff: `__wane__diff`,
    update: `__wane__update`,
  }

  private printInitMethod (fa: ComponentFactoryAnalyzer): this {
    const className = fa.getClassName()

    this.writer
      .writeLine(`__wane__init() {`)
      .indentBlock(() => {
        fa.printRootDomNodeAssignment(this.writer)
        this.writer
          .writeLine(`this.${this.names.data} = new ${className}()`)
        this
          .printTakeValuesFromAncestors(fa)
          .printDomNodesRegistration(fa)
          .printAssemblingDomNodes(fa)
          .printAssembleFactoryChildren(fa)
          .printDomPropsInit(fa)
          .printStylesEncapsulationAttributes(fa)
        this.writer
          .writeLine(`this.${this.names.diff}() // to populate the previous state`)
      })
      .writeLine(`},`)

    return this
  }

  protected generateDestroyViewMethod (fa: ComponentFactoryAnalyzer): this {
    if (fa.getPathToRoot().every(cmp => cmp instanceof ComponentFactoryAnalyzer)) {
      this.writer
        .writeLine(`// There is no need for __wane__destroy since this factory is not placed under`)
        .writeLine(`// any factory which can be destroyed (if you trace its ancestors, you'll see`)
        .writeLine(`// only components, no w:ifs or w:fors).`)
      return this
    }

    this.writer
      .writeLine(`__wane__destroy() {`)
      .indentBlock(() => {
        this.writer
          .writeLine(`this.__wane__factoryChildren.forEach(factoryChild => {`)
          .indentBlock(() => {
            this.writer
              .writeLine(`factoryChild.__wane__destroy()`)
          })
          .writeLine(`}`)
          .writeLine(`while (this.__wane__root.firstChild !== null) {`)
          .indentBlock(() => {
            this.writer
              .writeLine(`this.__wane__root.removeChild(this.__wane__root.firstChild)`)
          })
          .writeLine(`}`)
      })
      .writeLine(`},`)
    return this
  }

  private generateComponentFactory (fa: ComponentFactoryAnalyzer): this {
    this.writer
      .writeLine(`export default () => ({`)
      .indentBlock(() => {
        this.writer
          .writeLine(`${this.names.prevData}: {},`)
        this
          .printInitMethod(fa)
          .generateDiffMethod(fa)
          .generateUpdateViewMethod(fa)
          .generateDestroyViewMethod(fa)
      })
      .writeLine(`})`)
    return this
  }

  private printStylesEncapsulationAttributes (fa: ComponentFactoryAnalyzer): this {
    if (!fa.hasStyles()) return this
    const nodes = fa.getSavedNodes()
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      if (or(isInstance(TemplateNodeHtmlValue), isInstance(TemplateNodeComponentValue))(node)) {
        this.writer.writeLine(`this.__wane__domNodes[${i}].setAttribute('data-w-${fa.identifier.id}', '')`)
      }
    }
    return this
  }

  public printCode (fa: ComponentFactoryAnalyzer): CodeBlockWriter {
    this
      .resetWriter()
      .printImports(fa)
      .generateComponentFactory(fa)
      .getWriter()

    const styles = fa.getStyles()
    if (styles != null) {
      this.styleCodegen.addStyle(styles)
    }

    return this.writer
  }

  public getFactoryName (fa: ComponentFactoryAnalyzer): string {
    return `ComponentFactory_${fa.identifier.name}_${fa.identifier.id}`
  }

  public getFactoryFileNameWithoutExtension (fa: ComponentFactoryAnalyzer): string {
    return `${paramCase(fa.identifier.name)}-${fa.identifier.id}.component.factory`
  }

  public getFactoryFileName (fa: ComponentFactoryAnalyzer): string {
    return `${this.getFactoryFileNameWithoutExtension(fa)}.ts`
  }

  protected printAdditionalImports (fa: ComponentFactoryAnalyzer): this {
    const absoluteFilePath = fa.getComponentAbsoluteFilePathWithoutExtension()
    const importPath = path.relative(this.waneCompilerOptions.output, absoluteFilePath)
    this.writer
      .writeLine(`import { ${fa.getClassName()} } from './${importPath}'`)
    return this
  }

}
