import CodeBlockWriter from 'code-block-writer'
import { RepeatingViewFactoryAnalyzer } from '../../analyzer/factory-analyzer/repeating-view-factory-analyzer'
import { BaseFactoryCodegen } from '../base-factory-codegen'
import { TemplateNodeValue } from '../../template-nodes/nodes/template-node-value-base'
import { FactoryAnalyzer } from '../../analyzer'

export class RepeatingViewFactoryCodegen extends BaseFactoryCodegen {

  private generateInitMethod (fa: RepeatingViewFactoryAnalyzer): this {
    this.writer
      .writeLine(`__wane__init() {`)
      .indentBlock(() => {
        const scopeBoundary = fa.getFirstScopeBoundaryUpwardsIncludingSelf()
        let path = fa.printPathTo(scopeBoundary)

        const [
          openingIndex,
          closingIndex,
        ] = fa.getParent().getIndexesFor(fa.getAnchorViewNode().getValueOrThrow())

        const getKeyFunctionString = fa.getBinding().getKeyFunction()

        this.writer
          .writeLine(`this.__wane__contextFactory = ${path}`)
          .writeLine(`this.__wane__openingCommentOutlet = this.__wane__factoryParent.__wane__domNodes[${openingIndex}]`)
          .writeLine(`this.__wane__closingCommentOutlet = this.__wane__factoryParent.__wane__domNodes[${closingIndex}]`)
          .writeLine(`this.__wane__getKey = ${getKeyFunctionString}`) // TODO: let user set this
          .writeLine(`this.__wane__keys = []`)
          .writeLine(`this.__wane__commentsDict = {}`)
          .writeLine(`this.__wane__positions = {}`)
          .writeLine(`this.__wane__factoryChildren = {}`)

        fa.getBinding().printUpdate(this.writer, fa)

        this.writer
          .newLineIfLastNot()
          .writeLine(`for (let index = 0, length = this.__wane__data.length; index < length; index++) {`)
          .indentBlock(() => {
            this.writer
              .writeLine(`const item = this.__wane__data[index]`)
              .writeLine(`const key = this.__wane__getKey(item)`)
              .writeLine(`this.__wane__positions[key] = index`)
              .writeLine(`this.__wane__keys[index] = key`)
              .writeLine(`const opening = util.__wane__createComment(\`@for-item key: \${key} index: \${index} (opening)\`)`)
              .writeLine(`const closing = util.__wane__createComment(\`@for-item key: \${key} index: \${index} (closing)\`)`)

              .writeLine(`util.__wane__insertBefore(this.__wane__closingCommentOutlet, [opening, closing])`)

              .writeLine(`this.__wane__factoryChildren[key] = ${fa.getPartialViewFactoryAnalyzer().getFactoryName()}()`)
              .writeLine(`this.__wane__factoryChildren[key].__wane__factoryParent = this`)
              .writeLine(`this.__wane__factoryChildren[key].__wane__openingCommentOutlet = opening`)
              .writeLine(`this.__wane__factoryChildren[key].__wane__closingCommentOutlet = closing`)
              .writeLine(`this.__wane__factoryChildren[key].__wane__data = {item, index}`)

              .writeLine(`this.__wane__factoryChildren[key].__wane__init()`)
          })
          .writeLine(`}`)
      })

    this.writer.writeLine(`},`)

    return this
  }

  // TODO: This can be a helper i think
  protected generateMoveViewMethod (fa: RepeatingViewFactoryAnalyzer): this {
    this.writer
      .writeLine(`__wane__moveView(anchor, [start, end]) {`)
      .indentBlock(() => {
        this.writer
          .writeLine(`let current = start`)
          .writeLine(`while (current != end) {`)
          .indentBlock(() => {
            this.writer
              .writeLine(`const next = current.nextSibling`)
              .writeLine(`util.__wane__insertBefore(anchor, [current])`)
              .writeLine(`current = next`)
          })
          .writeLine(`}`)
          .writeLine(`util.__wane__insertBefore(anchor, [end])`)
      })
      .writeLine(`},`)
    return this
  }

  protected generateUpdateMethod (fa: RepeatingViewFactoryAnalyzer): this {
    this.writer
      .writeLine(`__wane__update(diff) {`)
      .indentBlock(() => {
        this.writer
          .writeLine(`const newModel = this.__wane__data`)
          .writeLine(`const oldKeys = this.__wane__keys`)
          .writeLine(`this.__wane__keys = []`)
          .writeLine(`const backlog: { [key: string]: number | undefined } = {}`)
          .writeLine(`const used: { [key: number]: true } = {} // indexes in oldKeys which are used in DOM`)
          .blankLine()
          .writeLine(`let currOldIndex: number = 0`)
          .writeLine(`let currNewIndex: number = 0`)
          .writeLine(`let currDomIndex: number = 0`)
          .blankLine()
          .writeLine(`while (currNewIndex < newModel.length && currOldIndex < oldKeys.length) {`)
          .indentBlock(() => {
            this.writer
              .writeLine(`const oldKey = oldKeys[currOldIndex]`)
              .writeLine(`const newKey = this.__wane__getKey(newModel[currNewIndex])`)
              .writeLine(`if (oldKey === newKey) {`)
              .indentBlock(() => {
                this.writer
                  .writeLine(`if (currOldIndex == currDomIndex) {`)
                  .indentBlock(() => {
                    this.writer
                      .writeLine(`// aligned`)
                      .writeLine(`// save key, update view, move the dom pointer, go to next new, go to next old`)
                      .writeLine(`this.__wane__keys.push(newKey)`)
                      .writeLine(`this.__wane__factoryChildren[newKey].__wane__data.item = newModel[currNewIndex]`)
                      .writeLine(`this.__wane__factoryChildren[newKey].__wane__data.index = currNewIndex`)
                      .writeLine(`this.__wane__factoryChildren[newKey].__wane__update(diff)`)
                      .writeLine(`used[currOldIndex] = true`)
                      .writeLine(`currDomIndex = util.__wane__getNextNotUsed(oldKeys, currDomIndex, used)`)
                      .writeLine(`currNewIndex++`)
                      .writeLine(`currOldIndex++`)
                  })
                  .writeLine(`} else {`)
                  .indentBlock(() => {
                    this.writer
                      .writeLine(`// save key, update view, move it before dom pointer, go to next new, go to next old`)
                      .writeLine(`this.__wane__keys.push(newKey)`)
                      .writeLine(`this.__wane__factoryChildren[newKey].__wane__data.item = newModel[currNewIndex]`)
                      .writeLine(`this.__wane__factoryChildren[newKey].__wane__data.index = currNewIndex`)
                      .writeLine(`this.__wane__factoryChildren[newKey].__wane__update(diff)`)
                      .writeLine(`this.__wane__moveView(this.__wane__factoryChildren[oldKeys[currDomIndex]].__wane__openingCommentOutlet, [this.__wane__factoryChildren[newKey].__wane__openingCommentOutlet, this.__wane__factoryChildren[newKey].__wane__closingCommentOutlet])`)
                      .writeLine(`used[currOldIndex] = true`)
                      .writeLine(`currNewIndex++`)
                      .writeLine(`currOldIndex++`)
                  })
                  .writeLine(`}`)
              })
              .writeLine(`} else {`)
              .indentBlock(() => {
                this.writer
                  .writeLine(`backlog[oldKey] = currOldIndex`)
                  .writeLine(`if (backlog[newKey] !== undefined) {`)
                  .indentBlock(() => {
                    this.writer
                      .writeLine(`// remove from backlog (important because of deleting later), only update`)
                      .writeLine(`this.__wane__keys.push(newKey)`)
                      .writeLine(`this.__wane__factoryChildren[newKey].__wane__data.item = newModel[currNewIndex]`)
                      .writeLine(`this.__wane__factoryChildren[newKey].__wane__data.index = currNewIndex`)
                      .writeLine(`this.__wane__factoryChildren[newKey].__wane__update(diff)`)
                      .writeLine(`backlog[newKey] = undefined`)
                      .writeLine(`used[currOldIndex] = true`)
                      .writeLine(`currDomIndex = util.__wane__getNextNotUsed(oldKeys, currDomIndex, used)`)
                      .writeLine(`currNewIndex++`)
                  })
                  .writeLine(`} else {`)
                  .indentBlock(() => {
                    this.writer
                      .writeLine(`currOldIndex++`)
                  })
                  .writeLine(`}`)
              })
              .writeLine(`}`)
          })
          .writeLine(`} // end of while loop`)
          .blankLine()
          .writeLine(`if (currNewIndex == newModel.length) {`)
          .indentBlock(() => {
            this.writer
              .writeLine(`// Removing the leftover nodes`)
              .indentBlock(() => {
                this.writer
                  .writeLine(`while (currOldIndex < oldKeys.length) {`)
                  .indentBlock(() => {
                    this.writer
                      .writeLine(`const k = oldKeys[currOldIndex]`)
                      .writeLine(`this.__wane__factoryChildren[k].__wane__destroy()`)
                      .writeLine(`this.__wane__positions[k] = undefined`)
                      .writeLine(`this.__wane__factoryChildren[k] = undefined`)
                      .writeLine(`currOldIndex++`)
                  })
                  .writeLine(`}`)
              })
              .writeLine(`const keys = Object.keys(backlog)`)
              .writeLine(`for (let i = 0; i < keys.length; i++) {`)
              .indentBlock(() => {
                this.writer
                  .writeLine(`const k = keys[i]`)
                  .writeLine(`if (backlog[k] === undefined) continue`)
                  .writeLine(`this.__wane__factoryChildren[k].__wane__destroy()`)
                  .writeLine(`this.__wane__positions[k] = undefined`)
                  .writeLine(`this.__wane__factoryChildren[k] = undefined`)
              })
              .writeLine(`}`)
          })
          .writeLine(`} else {`)
          .indentBlock(() => {
            this.writer
              .writeLine(`// update newKeys as well`)
              .writeLine(`while (currNewIndex < newModel.length) {`)
              .indentBlock(() => {
                this.writer
                  .writeLine(`const key = this.__wane__getKey(newModel[currNewIndex])`)
                  .writeLine(`this.__wane__keys.push(key)`)
                  .writeLine(`if (oldKeys[currDomIndex] === key) {`)
                  .indentBlock(() => {
                    this.writer
                      .writeLine(`// aligned`)
                      .writeLine(`this.__wane__factoryChildren[key].__wane__data.item = newModel[currNewIndex]`)
                      .writeLine(`this.__wane__factoryChildren[key].__wane__data.index = currNewIndex`)
                      .writeLine(`this.__wane__factoryChildren[key].__wane__update(diff)`)
                      .writeLine(`backlog[key] = undefined // we don't cant to delete it later`)
                      .writeLine(`used[currDomIndex] = true`)
                      .writeLine(`currDomIndex = util.__wane__getNextNotUsed(oldKeys, currDomIndex, used)`)
                  })
                  .writeLine(`} else {`)
                  .indentBlock(() => {
                    this.writer
                      .writeLine(`if (backlog[key] !== undefined) {`)
                      .indentBlock(() => {
                        this.writer
                          .writeLine(`// remove from backlog (important because of deleting later), move node, do not advance in dom`)
                          .writeLine(`this.__wane__moveView(this.__wane__factoryChildren[oldKeys[currDomIndex]].__wane__openingCommentOutlet, [this.__wane__factoryChildren[key].__wane__openingCommentOutlet, this.__wane__factoryChildren[key].__wane__closingCommentOutlet])`)
                          .writeLine(`used[backlog[key]] = true`)
                          .writeLine(`backlog[key] = undefined`)
                      })
                      .writeLine(`} else {`)
                      .indentBlock(() => {
                        this.writer
                          .writeLine(`// create it (do not advance in dom)`)
                          .writeLine(`const opening = util.__wane__createComment(\`@for-item key: \${key} index: \${currNewIndex} (opening)\`)`)
                          .writeLine(`const closing = util.__wane__createComment(\`@for-item key: \${key} index: \${currNewIndex} (closing)\`)`)

                          .writeLine(`// If we're appending to the end, we use the closing comment outlet of the whole w:for, otherwise we look where we're at in the DOM.`)
                          .writeLine(`if (currDomIndex >= oldKeys.length) {`)
                          .indentBlock(() => {
                            this.writer
                              .writeLine(`util.__wane__insertBefore(this.__wane__closingCommentOutlet, [opening, closing])`)
                          })
                          .writeLine(`} else {`)
                          .indentBlock(() => {
                            this.writer
                              .writeLine(`util.__wane__insertBefore(this.__wane__factoryChildren[oldKeys[currDomIndex]].__wane__openingCommentOutlet, [opening, closing])`)
                          })
                          .writeLine(`}`)

                          .writeLine(`this.__wane__positions[key] = currNewIndex`)
                          .writeLine(`this.__wane__factoryChildren[key] = ${fa.getPartialViewFactoryAnalyzer().getFactoryName()}()`)
                          .writeLine(`this.__wane__factoryChildren[key].__wane__factoryParent = this`)
                          .writeLine(`this.__wane__factoryChildren[key].__wane__openingCommentOutlet = opening`)
                          .writeLine(`this.__wane__factoryChildren[key].__wane__closingCommentOutlet = closing`)
                          .writeLine(`this.__wane__factoryChildren[key].__wane__data = {item: this.__wane__data[currNewIndex], index: currNewIndex}`)

                          .writeLine(`this.__wane__factoryChildren[key].__wane__init()`)

                      })
                      .writeLine(`}`)
                  })
                  .writeLine(`}`)
                  .writeLine(`currNewIndex++`)
              })
              .writeLine(`} // end of while inside else`)
              .blankLine()
              .writeLine(`const keys = Object.keys(backlog)`)
              .writeLine(`for (let i = 0; i < keys.length; i++) {`)
              .indentBlock(() => {
                this.writer
                  .writeLine(`const k = keys[i]`)
                  .writeLine(`if (backlog[k] == null) continue`)
                  .writeLine(`this.__wane__factoryChildren[k].__wane__destroy(k)`)
                  .writeLine(`this.__wane__positions[k] = undefined`)
                  .writeLine(`this.__wane__commentsDict[k] = undefined`)
              })
              .writeLine(`}`)
          })
          .writeLine(`}`)
          .blankLine()
      })
      .writeLine(`},`)

    return this
  }

  private generateDestroyView (fa: RepeatingViewFactoryAnalyzer) {
    this.writer
      .writeLine(`__wane__destroy() {`)
      .indentBlock(() => {
        // TODO
        this.writer.writeLine(`console.log('// TODO')`)
      })
      .writeLine(`},`)
  }

  private generateFactory (fa: RepeatingViewFactoryAnalyzer): this {
    this.writer
      .writeLine(`export default () => ({`)
      .indentBlock(() => {
        this
          .generateInitMethod(fa)
          .generateMoveViewMethod(fa)
          .generateUpdateMethod(fa)
          .generateDestroyView(fa)
      })
      .writeLine(`})`)
    return this
  }

  public printCode (fa: RepeatingViewFactoryAnalyzer): CodeBlockWriter {
    return this
      .resetWriter()
      .printImports(fa)
      .generateFactory(fa)
      .getWriter()
  }

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
