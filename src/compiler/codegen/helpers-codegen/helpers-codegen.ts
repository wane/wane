import CodeBlockWriter from 'code-block-writer'
import { BaseCodegen } from '../base-codegen'
import { FactoryAnalyzer } from '../../analyzer'
import { TemplateNodeValue } from '../../template-nodes/nodes/template-node-value-base'

const names = {
  createElement: `__wane__createElement`,
  createTextNode: `__wane__createTextNode`,
  createComment: `__wane__createComment`,
  createDocumentFragment: `__wane__createDocumentFragment`,
  appendChildren: `__wane__appendChildren`,
  insertBefore: `__wane__insertBefore`,
  removeChildren: `__wane__removeChildren`,
  addEventListener: `__wane__addEventListener`,

  createFactoryChildren: `__wane__createFactoryChildren`,
  appendFactoryChildren: `__wane__appendFactoryChildren`,

  destroyComponentFactory: `__wane__destroyComponentFactory`,
  destroyDirectiveFactory: `__wane__destroyDirectiveFactory`,
}

// TODO: This should not implement BaseCodegen at all
// It should be injected into all codegens instead
export class HelpersCodegen extends BaseCodegen {

  public names = names

  public static NAMES = names

  private generateHelperCreateElementInterface (): this {
    this.writer
      .writeLine(`export interface CreateElement {`)
      .indentBlock(() => {
        this.writer
          .writeLine(`<Name extends keyof HTMLElementTagNameMap>(name: Name): HTMLElementTagNameMap[Name],`)
          .writeLine(`(name: string): HTMLElement`)
      })
      .writeLine(`}`)
      .blankLine()
    return this
  }

  private generateHelperDiffType (): this {
    this.writer
      .writeLine(`/**`)
      .writeLine(`* For every component, an appropriate Model class is codegen'd which`)
      .writeLine(`* has all parts of the original class which are relevant for change`)
      .writeLine(`* detection. This is a diff object of that.`)
      .writeLine(`*/`)
      .writeLine(`type Diff<Model> = {`)
      .indentBlock(() => {
        this.writer
          .writeLine(`  [Key in keyof Model]: boolean`)
      })
      .writeLine(`}`)
    return this
  }

  public generateDomHelpers (): this {
    this.writer
      .writeLine(`/**`)
      .writeLine(` * DOM helpers`)
      .writeLine(` */`)
      .blankLine()
      .writeLine(`// Creates an HTML Element`)
      .writeLine(`export const ${this.names.createElement}: CreateElement = name => document.createElement(name)`)
      .blankLine()
      .writeLine(`// Creates a text node`)
      .writeLine(`export const ${this.names.createTextNode} = (data: any) => document.createTextNode(data)`)
      .blankLine()
      .writeLine(`// Creates a comment node`)
      .writeLine(`export const ${this.names.createComment} = (data: string) => document.createComment(data)`)
      .blankLine()
      .writeLine(`// Create a document fragment`)
      .writeLine(`export const ${this.names.createDocumentFragment} = () => document.createDocumentFragment()`)
      .blankLine()
      .writeLine(`// Append children to a parent and returns the parent.`)
      .writeLine(`export const ${this.names.appendChildren} = (element, children) => {`)
      .indentBlock(() => {
        this.writer
          .writeLine(`children.forEach(child => element.appendChild(child))`)
          .writeLine(`return element`)
      })
      .writeLine(`}`)
      .blankLine()
      .writeLine(`// Insert new nodes before a ref node, given its parent.`)
      .writeLine(`export const ${this.names.insertBefore} = (ref: ChildNode, newNodes: Node[]) => {`)
      .indentBlock(() => {
        this.writer
          .writeLine(`newNodes.forEach(newNode => ref.parentNode.insertBefore(newNode, ref))`)
      })
      .writeLine(`}`)
      .blankLine()
      .writeLine(`//`)
      .writeLine(`export const ${this.names.removeChildren} = (parent: Node, children: Node[]) => children.forEach(child => parent.removeChild(child))`)
      .blankLine()
      .writeLine(`// Add event listener to an HTML element.`)
      .writeLine(`export const ${this.names.addEventListener} = (element: HTMLElement, eventName: string, listener: EventListenerOrEventListenerObject) => element.addEventListener(eventName, listener)`)
      .blankLine()
    return this
  }

  private generateFactoryTreeHelpers (): this {
    this.writer
      .writeLine(`// Factory tree helper for creating children array.`)
      .writeLine(`export const ${this.names.createFactoryChildren} = (parent, newNodes) => {`)
      .indentBlock(() => {
        this.writer
          .writeLine(`parent.__wane__factoryChildren = newNodes`)
          .writeLine(`newNodes.forEach(newNode => {`)
          .indentBlock(() => {
            this.writer
              .writeLine(`newNode.__wane__factoryParent = parent`)
              .writeLine(`newNode.__wane__init()`)
          })
          .writeLine(`})`)
          .writeLine(`return parent`)
      })
      .writeLine(`}`)
      .blankLine()
      .writeLine(`// Append to existing array of children`)
      .writeLine(`export const ${this.names.appendFactoryChildren} = (parent, newNodes) => {`)
      .indentBlock(() => {
        this.writer
          .writeLine(`newNodes.forEach(newNode => parent.__wane__factoryChildren.push(newNode))`)
          .writeLine(`newNodes.forEach(newNode => newNode.__wane__factoryParent = parent)`)
          .writeLine(`newNodes.forEach(newNode => newNode.__wane__init())`)
      })
      .writeLine(`}`)
      .blankLine()
    return this
  }

  private generateGetNextNotUsed (): this {
    this.writer
      .writeLine(`export function __wane__getNextNotUsed(keys: string[], currentIndex: number, used: {[key: string]: true}): number {`)
      .indentBlock(() => {
        this.writer
          .writeLine(`while (++currentIndex < keys.length && used[keys[currentIndex]]) {}`)
          .writeLine(`return currentIndex`)
      })
      .writeLine(`}`)
    return this
  }

  private recursiveDestroy (factoryVarName: string): this {
    this.writer
      .writeLine(`${factoryVarName}.__wane__factoryChildren.forEach(child => {`)
      .indentBlock(() => {
        this.writer
          .writeLine(`child.__wane__destroy()`)
      })
      .writeLine(`})`)
    return this
  }

  private generateDestroyComponent (): this {
    this.writer
      .writeLine(`function ${this.names.destroyComponentFactory} (factory) {`)
      .indentBlock(() => {
        this.recursiveDestroy(`factory`)
        this.writer
          .writeLine(`while (factory.__wane__root.firstChild !== null) {`)
          .indentBlock(() => {
            this.writer
              .writeLine(`factory.__wane__root.removeChild(factory.__wane__root.firstChild)`)
          })
          .writeLine(`}`)
      })
      .writeLine(`}`)
    return this
  }

  private generateDestroyDirective (): this {
    this.writer
      .writeLine(`export function ${this.names.destroyDirectiveFactory} (factory) {`)
      .indentBlock(() => {
        this.recursiveDestroy(`factory`)
        this.writer
          .writeLine(`let node = factory.__wane__openingCommentOutlet.nextSibling`)
          .writeLine(`while (node != factory.__wane__closingCommentOutlet) {`)
          .indentBlock(() => {
            this.writer
              .writeLine(`const nextNode = node.nextSibling`)
              .writeLine(`node.remove()`)
              .writeLine(`node = nextNode`)
          })
          .writeLine(`}`)
      })
      .writeLine(`}`)
    return this
  }

  public printCode (): CodeBlockWriter {
    return this
      .resetWriter()
      .generateHelperCreateElementInterface()
      .generateHelperDiffType()
      .generateDomHelpers()
      .generateFactoryTreeHelpers()
      .generateGetNextNotUsed()
      .generateDestroyDirective()
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
