import { BaseCodegen } from './base-codegen'
import { FactoryAnalyzer } from '../analyzer'
import { TemplateNodeValue } from '../template-nodes/nodes/template-node-value-base'
import { ViewBinding } from '../template-nodes/view-bindings'
import iterare from 'iterare'
import { ViewBoundPropertyAccess } from '../template-nodes/view-bound-value'
import { getIntersection } from '../utils/utils'

export abstract class BaseFactoryCodegen extends BaseCodegen {

  public abstract getFactoryName (fa: FactoryAnalyzer<TemplateNodeValue>): string

  public abstract getFactoryFileName (fa: FactoryAnalyzer<TemplateNodeValue>): string

  public abstract getFactoryFileNameWithoutExtension (fa: FactoryAnalyzer<TemplateNodeValue>): string

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
        binding.printInit(this.writer, fa)
        this.writer.blankLineIfLastNot()
      }
    }

    return this
  }

  protected printDomNodesRegistration (fa: FactoryAnalyzer<TemplateNodeValue>): this {
    const partialView = fa.getPartialViewFactoryAnalyzer()
    this.writer
      .writeLine(`// Create a flat array of all DOM nodes which this component controls:`)
      .writeLine(`this.__wane__domNodes = [`)
      .indentBlock(() => {
        let index = 0
        Array.from(new Set(partialView.getSavedNodes())).forEach(node => {
          node.printDomInit(partialView).forEach(init => {
            this.writer.writeLine(`/*${index++}*/ ${init},`)
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
        binding.printInit(this.writer, fa)
        this.writer.newLineIfLastNot()
        isAtLeastOneLineWritten = true
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
    if (fa.hasChildren()) {
      this.writer
        .writeLine(`util.__wane__createFactoryChildren(this, [`)
        .indentBlock(() => {
          for (const factory of fa.getPartialViewFactoryAnalyzer().getChildrenFactories()) {
            const name = factory.getFactoryName()
            this.writer.writeLine(`${name}(),`)
          }
        })
        .writeLine(`])`)
    } else {
      this.writer.writeLine(`this.__wane__factoryChildren = []`)
    }
    return this
  }

  // TODO: This will always be empty for PartialView_ConditionalView
  protected generateDiffMethod (fa: FactoryAnalyzer<TemplateNodeValue>): this {
    this.writer
      .writeLine(`__wane__diff() {`)
      .indentBlock(() => {
        this.writer
          .writeLine(`return {`)
          .indentBlock(() => {
            for (const name of fa.getDiffablePropNames()) {
              this.writer
                .write(`${name}: this.__wane__prevData.${name}`)
                .write(` !== `)
                .write(`(this.__wane__prevData.${name} = this.__wane__data.${name}),`)
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
                                      callDiffAtStart: boolean = true,
                                      mergeDiffs: boolean = false): this {
    this.writer
      .writeLine(callDiffAtStart ? `${name}() {` : `${name}(diff) {`)
      .indentBlock(() => {
        this.writer
          .conditionalWriteLine(callDiffAtStart && !mergeDiffs, `const diff = this.__wane__diff()`)
          .conditionalWriteLine(mergeDiffs, `Object.assign(diff, this.__wane__diff())`)

        this.writer.writeLine(`// Dom nodes...`)
        const map = fa.getDomDiffMap()
        for (const [domNodeIndex, boundValues] of map) {
          const condition = ViewBoundPropertyAccess.printCondition(boundValues)
          this.writer
            .writeLine(`if (${condition}) {`)
            .indentBlock(() => {
              // TODO: This can leave an empty if block if nothing is written inside.
              // The way updates are printed needs some rethinking so it's possible
              // to understand what CAN be written before it's written to the file.
              for (const boundValue of boundValues) {
                const binding = boundValue.getViewBinding()
                binding.printUpdate(this.writer, fa)
              }
            })
            .writeLine(`}`)
        }
        this.writer.writeLine(`// ...Dom nodes end.`)

        this.writer.writeLine(`// Factory children...`)

        const faDiffMap = fa.getFaDiffMap()
        for (const [factoryDescendant, boundValues] of fa.getFaDiffMap()) {
          const condition = ViewBoundPropertyAccess.printCondition(boundValues)
          this.writer
            .writeLine(`if (${condition}) {`)
            .indentBlock(() => {

              for (const boundValue of boundValues) {
                const binding = boundValue.getViewBinding()
                const definitionFactory = boundValue.getFirstScopeBoundaryUpwardsIncludingSelf()
                const path = factoryDescendant.getPathTo(definitionFactory)

                // if (boundValue instanceof ViewBoundPropertyAccess && boundValue.getRawPath().startsWith('item.')) {
                //   console.log(path.map(x => x.getFactoryName()))
                // }

                /**
                 * Assignment in "updated" is printed if the resolved factory is
                 * the first scope boundary upwards (for components, this is self,
                 * for  directives, this is the context they are placed in),
                 * and if the path to the factoryDescendant (which is being updated)
                 * is a direct descendant of `this`.
                 */
                if (definitionFactory == fa.getFirstScopeBoundaryUpwardsIncludingSelf() && factoryDescendant.isChildOf(fa)) {
                  try {
                    binding.printUpdate(this.writer, fa)
                  } catch (e) {
                    this.writer.writeLine(`/** ${e} */`)
                  }
                }

                /**
                 * `update` call is being made if `this` is included in the path
                 * to the resolved factory. This should be a sub-case of the case
                 * above, meaning update should be printed whenever
                 */
                if (path.includes(fa)) {
                  const [factoryChildInThePath] = getIntersection(
                    fa.getChildrenFactories(),
                    path,
                  )
                  if (factoryChildInThePath == null) {
                    throw new Error(`The intersection between the path and factory children should exist.`)
                  }
                  const factoryChildIndex = factoryChildInThePath.getFactoryIndexAsChild()
                  const factoryChildAccess = `this.__wane__factoryChildren[${factoryChildIndex} /*${factoryChildInThePath.getFactoryName()}*/]`
                  this.writer.writeLine(`${factoryChildAccess}.__wane__update(diff)`)
                }
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
