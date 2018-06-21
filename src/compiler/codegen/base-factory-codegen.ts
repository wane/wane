import { BaseCodegen } from './base-codegen'
import { FactoryAnalyzer } from '../analyzer'
import { TemplateNodeValue } from '../template-nodes/nodes/template-node-value-base'
import { ViewBinding } from '../template-nodes/view-bindings'
import iterare from 'iterare'
import { ViewBoundPropertyAccess } from '../template-nodes/view-bound-value'

export abstract class BaseFactoryCodegen extends BaseCodegen {

  public abstract getFactoryName (fa: FactoryAnalyzer<TemplateNodeValue>): string

  public abstract getFactoryFileName (fa: FactoryAnalyzer<TemplateNodeValue>): string

  public abstract getFactoryFileNameWithoutExtension (fa: FactoryAnalyzer<TemplateNodeValue>): string

  // final (ffs typescript)
  protected printImports (fa: FactoryAnalyzer<TemplateNodeValue>): this {
    this.writer
      .writeLine(`import * as util from './util.js'`)
    for (const factory of fa.getChildrenFactories()) {
      this.writer
        .writeLine(`import ${factory.getFactoryName()} from './${factory.getFactoryFilename()}'`)
    }
    this.printAdditionalImports(fa)
    return this
  }

  protected printAdditionalImports (fa: FactoryAnalyzer<TemplateNodeValue>): this {
    return this
  }

  protected printTakeValuesFromAncestors (fa: FactoryAnalyzer<TemplateNodeValue>): this {
    // We can't pass anything from ancestors if there is no parent factory.
    if (fa.getParentOrUndefined() == null) {
      return this
    }

    for (const binding of fa.getSelfBindings()) {
      if (!binding.isNativeHtml()) {
        binding.printInit(this.writer, `this.__wane__data`, fa)
        this.writer.blankLineIfLastNot()
      }
    }

    return this
  }

  protected printDomNodesRegistration (fa: FactoryAnalyzer<TemplateNodeValue>): this {
    this.writer
      .writeLine(`// Create a flat array of all DOM nodes which this component controls:`)
      .writeLine(`this.__wane__domNodes = [`)
      .indentBlock(() => {
        Array.from(new Set(fa.getPartialViewFactoryAnalyzer().getSavedNodes())).forEach(node => {
          node.printDomInit().forEach(init => {
            this.writer.writeLine(`${init},`)
          })
        })
      })
      .writeLine(`]`)
    return this
  }

  protected _printDomPropsInit (fa: FactoryAnalyzer<TemplateNodeValue>,
                                predicate: (binding: ViewBinding<TemplateNodeValue>) => boolean,
                                comment: string) {
    this.writer.writeLine(`// ${comment}`)
    let isAtLeastOneLineWritten = false
    iterare(fa.getHtmlNativeDomBindings())
      .filter(predicate)
      .forEach(binding => {
        for (const index of fa.getIndexesFor(binding.getTemplateNode())) {
          binding.printInit(this.writer, `this.__wane__domNodes[${index}]`)
          this.writer.newLineIfLastNot()
          isAtLeastOneLineWritten = true
        }
      })
    if (!isAtLeastOneLineWritten) {
      this.writer.writeLine(`// Nothing to do here.`)
    }
    this.writer.newLine()
    return this
  }

  protected printDomPropsInit (fa: FactoryAnalyzer<TemplateNodeValue>): this {
    return this
      ._printDomPropsInit(fa.getPartialViewFactoryAnalyzer(), binding => binding.boundValue.isConstant(), `Initializing static stuff:`)
      ._printDomPropsInit(fa.getPartialViewFactoryAnalyzer(), binding => !binding.boundValue.isConstant(), `Initializing dynamic stuff:`)
  }

  protected printAssemblingDomNodes (fa: FactoryAnalyzer<TemplateNodeValue>): this {
    this.writer.writeLine(`// Creating the DOM tree:`)
    fa.getPartialViewFactoryAnalyzer().printAssemblingDomNodes(this.writer)
    return this
  }

  protected printAssembleFactoryChildren (fa: FactoryAnalyzer<TemplateNodeValue>): this {
    this.writer
      .writeLine(`util.__wane__createFactoryChildren(this, [`)
      .indentBlock(() => {
        for (const factory of fa.getPartialViewFactoryAnalyzer().getChildrenFactories()) {
          const name = factory.getFactoryName()
          this.writer.writeLine(`${name}(),`)
        }
      })
      .writeLine(`])`)
    return this
  }

  protected generateDiffMethod (fa: FactoryAnalyzer<TemplateNodeValue>): this {
    this.writer
      .writeLine(`__wane__diff() {`)
      .indentBlock(() => {
        this.writer
          .writeLine(`return {`)
          .indentBlock(() => {
            for (const boundValue of fa.responsibleFor()) {
              const name = boundValue.getName()
              this.writer
                .write(`${name}: this.__wane__prevData.${name}`)
                .write(` !== `)
                .write(`(`)
                .write(`this.__wane__prevData.${name}`)
                .write(` = `)
                .write(`this.__wane__data.${name}`)
                .write(`),`)
                .newLine()
            }
          })
          .writeLine(`}`)
      })
      .writeLine(`},`)
    return this
  }

  protected generateUpdateViewMethod (fa: FactoryAnalyzer<TemplateNodeValue>,
                                      name: string = `__wane__update`,
                                      callDiffAtStart: boolean = true): this {
    this.writer
      .writeLine(callDiffAtStart ? `${name}() {` : `${name}(diff) {`)
      .indentBlock(() => {
        this.writer.conditionalWriteLine(callDiffAtStart, `const diff = this.__wane__diff()`)

        this.writer.writeLine(`// Dom nodes...`)
        for (const [domNodeIndex, boundValues] of fa.getDomDiffMap()) {
          const condition = ViewBoundPropertyAccess.printCondition(boundValues)
          this.writer
            .writeLine(`if (${condition}) {`)
            .indentBlock(() => {
              for (const boundValue of boundValues) {
                const binding = boundValue.getViewBinding()
                const instance = `this.__wane__domNodes[${domNodeIndex}]`
                binding.printUpdate(this.writer, instance, fa)
              }
            })
            .writeLine(`}`)
        }
        this.writer.writeLine(`// ...Dom nodes end.`)

        this.writer.writeLine(`// Factory children...`)
        for (const [factoryChild, boundValues] of fa.getFaDiffMap()) {
          const condition = ViewBoundPropertyAccess.printCondition(boundValues)
          this.writer
            .writeLine(`if (${condition}) {`)
            .indentBlock(() => {
              for (const boundValue of boundValues) {
                const binding = boundValue.getViewBinding()
                const factoryChildIndex = factoryChild.getFactoryIndexAsChild()
                const factoryChildAccess = `this.__wane__factoryChildren[${factoryChildIndex}]`
                const factoryChildDataAccess = `${factoryChildAccess}.__wane__data`
                binding.printUpdate(this.writer, factoryChildDataAccess, fa)
                this.writer.writeLine(`${factoryChildAccess}.__wane__update()`)
              }
            })
            .writeLine(`}`)
        }
        this.writer.writeLine(`// ...Factory children end.`)

      })
      .writeLine(`}`)
    return this
  }

}
