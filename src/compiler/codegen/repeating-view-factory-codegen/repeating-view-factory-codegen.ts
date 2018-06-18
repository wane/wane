// import CodeBlockWriter from 'code-block-writer'
// import { RepeatingViewFactoryAnalyzer } from '../../analyzer/factory-analyzer/repeating-view-factory-analyzer'
// import { TemplateNodeValue } from '../../template-nodes'
// import { TemplateNodeOutputFunctionArgType } from '../../template-nodes/nodes/html-node'
// import { PartialViewFactoryAnalyzer } from '../../analyzer/factory-analyzer/partial-view-factory-analyzer'
// import { TreeNode } from '../../utils/tree'
// import { BaseFactoryCodegen } from '../base-factory-codegen'
//
// export class RepeatingViewFactoryCodegen extends BaseFactoryCodegen {
//
//   private printImports (fa: RepeatingViewFactoryAnalyzer): this {
//     this.writer
//       .writeLine(`import * as util from './util.js'`)
//     for (const factory of fa.getChildren().values()) {
//       this.writer
//         .writeLine(`import ${factory.factoryName} from './${factory.getFileNameWithoutExtension()}'`)
//     }
//     return this
//   }
//
//   private generateCreateViewDomNodes (fa: RepeatingViewFactoryAnalyzer): this {
//     this.writer
//       .writeLine(`this.domNodes = [`)
//       .indentBlock(() => {
//         const visited = new Set<TemplateNodeValue>()
//         fa.getIndexToViewNodeMap().forEach((value, index) => {
//           if (visited.has(value)) return
//           value.printDomCreation().forEach((string, i) => {
//             this.writer
//               .writeLine(`/*${index + i}*/ ${string},`)
//           })
//           visited.add(value)
//         })
//       })
//       .writeLine(`]`)
//
//     return this
//   }
//
//   private generateCreateViewMethodDomPropsStatic (fa: RepeatingViewFactoryAnalyzer): this {
//     this.writer.writeLine(`// Initializing static stuff:`)
//     let isAtLeastOneLineWritten = false
//     fa.getIndexToViewNodeMap().forEach((viewNode, index) => {
//       const domNodesAccess = `this.domNodes[${index}]`
//       const prints = viewNode.printInitialization(domNodesAccess)
//       prints.forEach(line => {
//         this.writer.writeLine(line)
//         isAtLeastOneLineWritten = true
//       })
//     })
//     if (!isAtLeastOneLineWritten) {
//       this.writer.writeLine(`// Nothing to do here.`)
//     }
//     return this
//   }
//
//   private generateCreateViewMethodDomPropsDynamic (fa: RepeatingViewFactoryAnalyzer): this {
//     const domBindings = fa.getDomBindings()
//     let isAtLeastOneLineWritten: boolean = false
//     this.writer.writeLine(`// Initializing dynamic stuff:`)
//     domBindings.forEach((bindings, node) => {
//       if (bindings.size == 0) return
//       const domNodesIndexes = fa.getIndexesOfViewNodeOrThrow(node)
//       domNodesIndexes.forEach(domNodesIndex => {
//         const instanceAccessor = `this.domNodes[${domNodesIndex}]`
//         this.writer.indentBlock(() => {
//           bindings.forEach(binding => {
//             const dataAccessor = fa.getRelativeAccessorPathFor(binding.getBoundValueAccessorPath())
//             this.writer
//               .writeLine(`${instanceAccessor}.${binding.getName()} = ${dataAccessor}`)
//           })
//         })
//         isAtLeastOneLineWritten = true
//       })
//     })
//     if (!isAtLeastOneLineWritten) {
//       this.writer.writeLine(`// Nothing to do here.`)
//     }
//     this.writer.newLine()
//     return this
//   }
//
//   private generateCreateViewMethodDomProps (fa: RepeatingViewFactoryAnalyzer): this {
//     return this
//       .generateCreateViewMethodDomPropsStatic(fa)
//       .generateCreateViewMethodDomPropsDynamic(fa)
//   }
//
//   private generateCreateViewMethodAddEventListeners (fa: RepeatingViewFactoryAnalyzer): this {
//     for (const [node, outputs] of fa.getAttachedEventsToHtmlElements()) {
//       fa.getIndexesOfViewNodeOrThrow(node).forEach(domNodesIndex => {
//         for (const [eventName, fn] of outputs) {
//           const usesNativeEvent = fn.args.some(arg => arg.type == TemplateNodeOutputFunctionArgType.Placeholder)
//           this.writer.write(`ael(this.domNodes[${domNodesIndex}], '${eventName}', (`)
//             .conditionalWrite(usesNativeEvent, `$event`)
//             .write(`) => {`)
//             .newLine()
//             .indentBlock(() => {
//               const params: string[] = []
//               for (const arg of fn.args) {
//                 switch (arg.type) {
//                   case TemplateNodeOutputFunctionArgType.Placeholder:
//                     params.push(`$event`)
//                     break
//                   case TemplateNodeOutputFunctionArgType.Literal:
//                     params.push(arg.value)
//                     break
//                   case TemplateNodeOutputFunctionArgType.Property:
//                     // TODO: handle taking a value from the context etc
//                     params.push(arg.name)
//                     break
//                 }
//               }
//               this.writer
//                 .writeLine(`this.contextFactory.instance.${fn.name}(${params.join(', ')})`)
//
//               fa.contextFactory.getFactoriesWhoseStateCanChangeByCalling(fn.name)
//                 .forEach(affectedFactory => {
//                   const hopsCount = fa.getHopCountUntilNearestSelfOrAncestorOrThrow(f => f == affectedFactory)
//                   const parentChain = Array.from({length: hopsCount}).fill(`.parent_`).join('')
//                   const args = affectedFactory instanceof PartialViewFactoryAnalyzer ? 'diff' : ''
//                   this.writer.writeLine(`this${parentChain}.update_(${args})`)
//                 })
//             })
//             .writeLine(`})`)
//         }
//       })
//     }
//     return this
//   }
//
//   private _generateCreateViewMethodTreeCreation (
//     fa: RepeatingViewFactoryAnalyzer,
//     node: TreeNode<TemplateNodeValue>,
//     isRoot: boolean = true,
//   ): this {
//     fa.getIndexesOfViewNodeOrThrow(node).forEach(index => {
//       const nodeChildren = node.getChildren()
//       this.writer
//         .writeLine(`ac(this.domNodes[${index}], [`)
//         .indentBlock(() => {
//           node.getChildren().forEach(childNode => {
//             this._generateCreateViewMethodTreeCreation(fa, childNode, false)
//           })
//         })
//         .write(`])`)
//         .conditionalWrite(!isRoot, `,`)
//         .newLine()
//     })
//     return this
//   }
//
//   private generateCreateViewMethodTreeCreation (fa: RepeatingViewFactoryAnalyzer): this {
//     fa.view.forEach(node => {
//       this._generateCreateViewMethodTreeCreation(fa, node)
//     })
//     const rootIndexes: number[] = fa.view
//       .map(root => [...fa.getIndexesOfViewNodeOrThrow(root)])
//       .reduce((acc, curr) => [...acc, ...curr], [])
//
//     const anchorViewNodeParent = fa.getAnchorViewNode().getParentOrUndefined()
//     let parentCodegen: string
//     if (anchorViewNodeParent == null) {
//       // the comment outlet is the root in the context component
//       parentCodegen = `this.contextFactory.root_`
//     } else {
//       // the comment outlet is inside some dom node of parent component
//       const parentRootIndexes = fa.parent.getIndexesOfViewNodeOrThrow(anchorViewNodeParent)
//       const closingIndex: number = Math.max(...parentRootIndexes)
//       parentCodegen = `this.parent_.domNodes[${closingIndex}]`
//     }
//
//     this.writer
//       .writeLine(`ib(${parentCodegen}, this.closingCommentOutlet, [openingComment, closingComment])`)
//       .writeLine(`ib(${parentCodegen}, closingComment, [`)
//       .indentBlock(() => {
//         rootIndexes.forEach(rootIndex => {
//           this.writer.writeLine(`this.domNodes[${rootIndex}],`)
//         })
//       })
//       .writeLine(`])`)
//
//     return this
//   }
//
//   private generateAppendingFactoryChildren (fa: RepeatingViewFactoryAnalyzer): this {
//     const key = fa.getKeyArgName()
//     this.writer
//       .writeLine(`appendFactories(this, [`)
//       .indentBlock(() => {
//         for (const childFactory of fa.children.values()) {
//           this.writer.writeLine(`${childFactory.factoryName}(${key}))`)
//         }
//       })
//       .writeLine(`])`)
//     return this
//   }
//
//   private generateCreateView (fa: RepeatingViewFactoryAnalyzer): this {
//     const key = fa.getKeyArgName()
//     this.writer
//       .writeLine(`createView(${key}, /* insert before what? */ anchor = this.closingCommentOutlet) {`)
//       .indentBlock(() => {
//         const iterativeConstantName = fa.getAnchorViewNode().getValueOrThrow().getBinding().getIterativeConstantName()
//         this.writer
//           .writeLine(`const index = this.positions[${key}]`)
//           .writeLine(`const [openingComment, closingComment] = this.commentsDict[${key}]`)
//           .writeLine(`const item = this.array[index]`)
//         this
//           .generateCreateViewDomNodes(fa)
//           .generateCreateViewMethodDomProps(fa)
//           .generateCreateViewMethodAddEventListeners(fa)
//           .generateCreateViewMethodTreeCreation(fa)
//           .generateAppendingFactoryChildren(fa)
//       })
//       .writeLine(`},`)
//     return this
//   }
//
//   private generateUpdateView (fa: RepeatingViewFactoryAnalyzer): this {
//     this.writer
//       .writeLine(`updateView(index) {`)
//       .indentBlock(() => {
//         this.writer
//           .writeLine(`const diff = this.diff(index)`)
//       })
//       .writeLine(`},`)
//     return this
//   }
//
//   private generateDestroyView (fa: RepeatingViewFactoryAnalyzer): this {
//     this.writer
//       .writeLine(`destroyView(index) {`)
//       .indentBlock(() => {
//
//       })
//       .writeLine(`},`)
//     return this
//   }
//
//   private generateViewDiff (fa: RepeatingViewFactoryAnalyzer): this {
//     this.writer
//       .writeLine(`diff(index) {`)
//       .indentBlock(() => {
//
//       })
//       .writeLine(`},`)
//     return this
//   }
//
//   private generateInitMethod (fa: RepeatingViewFactoryAnalyzer): this {
//     this.writer
//       .writeLine(`init_() {`)
//       .indentBlock(() => {
//         const hopCount = fa.getHopsCountUntilContextFactory()
//         const parentChain = Array.from({length: hopCount}).fill(`.parent_`).join('')
//         const [
//           openingIndex,
//           closingIndex,
//         ] = fa.parent.getIndexesOfViewNodeOrThrow(fa.getAnchorViewNode())
//
//         const arrayToStore = `this`
//         const arrayGrab = `this.contextFactory.instance`
//
//         this.writer
//           .writeLine(`this.contextFactory = this${parentChain}`)
//           .writeLine(`this.openingCommentOutlet = this.parent_.domNodes[${openingIndex}]`)
//           .writeLine(`this.closingCommentOutlet = this.parent_.domNodes[${closingIndex}]`)
//           .writeLine(`this.getKey = item => item.id`) // TODO: let user set this
//           .writeLine(`this.keys = []`)
//           .writeLine(`this.commentsDict = {}`)
//           .writeLine(`this.positions = {}`)
//           .writeLine(`this.children_ = []`)
//           .writeLine(fa.getBinding().printUpdate(arrayToStore, arrayGrab))
//           .newLine()
//           .writeLine(`for (let index = 0, length = this.array.length; index < length; index++) {`)
//           .indentBlock(() => {
//             this.writer
//               .writeLine(`const item = this.array[index]`)
//               .writeLine(`const key = this.getKey(item)`)
//               .writeLine(`this.positions[key] = index`)
//               .writeLine(`this.keys[index] = key`)
//               .writeLine(`const opening = cc(\`@for-item key: \${key} index: \${index} (opening)\`)`)
//               .writeLine(`const closing = cc(\`@for-item key: \${key} index: \${index} (closing)\`)`)
//               .writeLine(`this.commentsDict[key] = [opening, closing]`)
//               .writeLine(`this.createView(key)`)
//           })
//           .writeLine(`}`)
//       })
//
//     this.writer.writeLine(`},`)
//     return this
//   }
//
//   private generateUpdateViewMethod (fa: RepeatingViewFactoryAnalyzer): this {
//     const binding = fa.getBinding()
//
//     this.writer
//       .writeLine(`update_() {`)
//       .indentBlock(() => {
//         this.writer
//           .writeLine(`const newModel = this.array = this.contextFactory.instance.${binding.getBoundValueAccessorPath()}`)
//           .writeLine(`const comments = this.commentsDict`)
//           .writeLine(`const oldKeys = this.keys`)
//           .writeLine(`this.keys = []`)
//           .writeLine(`const backlog: { [key: string]: [Comment, Comment] | undefined } = {}`)
//           .writeLine(`const used: { [key: string]: true } = {}`)
//           .blankLine()
//           .writeLine(`let currOldIndex: number = 0`)
//           .writeLine(`let currNewIndex: number = 0`)
//           .writeLine(`let currDomIndex: number = 0`)
//           .blankLine()
//           .writeLine(`while (currNewIndex < newModel.length && currOldIndex < oldKeys.length) {`)
//           .indentBlock(() => {
//             this.writer
//               .writeLine(`const oldKey = oldKeys[currOldIndex]`)
//               .writeLine(`const newKey = this.getKey(newModel[currNewIndex])`)
//               .writeLine(`if (oldKey === newKey) {`)
//               .indentBlock(() => {
//                 this.writer
//                   .writeLine(`if (currOldIndex == currDomIndex) {`)
//                   .indentBlock(() => {
//                     this.writer
//                       .writeLine(`// aligned`)
//                       .writeLine(`// save key, update view, move the dom pointer, go to next new, go to next old`)
//                       .writeLine(`this.keys.push(newKey)`)
//                       .writeLine(`this.updateView(newKey)`)
//                       .writeLine(`used[oldKey] = true`)
//                       .writeLine(`currDomIndex = getNextNotUsed(oldKeys, currDomIndex, used)`)
//                       .writeLine(`currNewIndex++`)
//                       .writeLine(`currOldIndex++`)
//                   })
//                   .writeLine(`} else {`)
//                   .indentBlock(() => {
//                     this.writer
//                       .writeLine(`// save key, update view, move it before dom poiner, go to next new, go to next old`)
//                       .writeLine(`this.keys.push(newKey)`)
//                       .writeLine(`this.updateView(newKey)`)
//                       .writeLine(`this.moveView(comments[oldKeys[currDomIndex]][0], comments[newKey]`)
//                       .writeLine(`used[oldKey] = true`)
//                       .writeLine(`currNewIndex++`)
//                       .writeLine(`currOldIndex++`)
//                   })
//                   .writeLine(`}`)
//               })
//               .writeLine(`} else {`)
//               .indentBlock(() => {
//                 this.writer
//                   .writeLine(`backlog[oldKey] = comments[oldKey]`)
//                   .writeLine(`let fromBacklog = backlog[newKey]`)
//                   .writeLine(`if (fromBacklog != null) {`)
//                   .indentBlock(() => {
//                     this.writer
//                       .writeLine(`// remove from backlog (important because of deleting later), only update`)
//                       .writeLine(`this.keys.push(newKey)`)
//                       .writeLine(`this.updateView(newKey)`)
//                       .writeLine(`backlog[newKey] = undefined`)
//                       .writeLine(`used[oldKey] = true`)
//                       .writeLine(`currDomIndex = getNextNotUsed(oldKeys, currDomIndex, used)`)
//                       .writeLine(`currNewIndex++`)
//                   })
//                   .writeLine(`} else {`)
//                   .indentBlock(() => {
//                     this.writer
//                       .writeLine(`currOldIndex++`)
//                   })
//                   .writeLine(`}`)
//               })
//               .writeLine(`}`)
//           })
//           .writeLine(`} // end of while loop`)
//           .blankLine()
//           .writeLine(`if (currNewIndex == newModel.length) {`)
//           .indentBlock(() => {
//             this.writer
//               .writeLine(`// Removing the leftover nodes`)
//               .indentBlock(() => {
//                 this.writer
//                   .writeLine(`while (currOldIndex < oldKeys.length) {`)
//                   .writeLine(`const k: string = oldKeys[currOldIndex]`)
//                   .writeLine(`this.destroyView(key)`)
//                   .writeLine(`this.positions[key] = undefined`)
//                   .writeLine(`this.commentsDict[k] = undefined`)
//                   .writeLine(`this.currOldIndex++`)
//               })
//               .writeLine(`}`)
//               .writeLine(`const keys = Object.keys(backlog)`)
//               .writeLine(`for (let i = 0; i < keys.length; i++) {`)
//               .indentBlock(() => {
//                 this.writer
//                   .writeLine(`const k = keys[i]`)
//                   .writeLine(`if (backlog[k] == null) continue`)
//                   .writeLine(`this.destroyView(k)`)
//                   .writeLine(`this.positions[k] = undefined`)
//                   .writeLine(`this.commentsDict[k] = undefined`)
//               })
//               .writeLine(`}`)
//           })
//           .writeLine(`} else {`)
//           .indentBlock(() => {
//             this.writer
//               .writeLine(`// update newKeys as well`)
//               .writeLine(`while (currNewIndex < newModel.length) {`)
//               .indentBlock(() => {
//                 this.writer
//                   .writeLine(`const key = this.getKey(newModel[currNewIndex])`)
//                   .writeLine(`this.keys.push(key)`)
//                   .writeLine(`if (oldKeys[currDomIndex] ===  key) {`)
//                   .indentBlock(() => {
//                     this.writer
//                       .writeLine(`// aligned`)
//                       .writeLine(`this.updateView(key)`)
//                       .writeLine(`backlog[key] = undefined // we dont cant to delete it later`)
//                       .writeLine(`used[key] = true`)
//                       .writeLine(`currDomIndex = getNextNotUsed(oldKeys, currDomIndex, used)`)
//                   })
//                   .writeLine(`} else {`)
//                   .indentBlock(() => {
//                     this.writer
//                       .writeLine(`const fromBacklog = backlog[key]`)
//                       .writeLine(`if (fromBacklog != null) {`)
//                       .indentBlock(() => {
//                         this.writer
//                           .writeLine(`// remove from backlog (important becauyse of deleting later), move node, do not advance in dom`)
//                           .writeLine(`backlog[key] = undefined`)
//                           .writeLine(`this.moveView(comments[oldKeys[currDomIndex]][0], comments[key]`)
//                       })
//                       .writeLine(`} else {`)
//                       .indentBlock(() => {
//                         this.writer
//                           .writeLine(`// create it (do not advance in dom)`)
//                           .writeLine(`const commentStart = cc(\`@for-item start\`)`)
//                           .writeLine(`const commentEnd = cc(\`@for-item end\`)`)
//                           .writeLine(`this.commentsDict[key] = [commentStart, commentEnd]`)
//                           .writeLine(`const anchor = comments[oldKeys[currDomIndex]] == null ? /* default param */ undefined : comments[oldKeys[currDomIndex]][0]`)
//                           .writeLine(`this.positions[key] = currNewIndex`)
//                           .writeLine(`this.createView(key, anchor)`)
//                       })
//                       .writeLine(`}`)
//                   })
//                   .writeLine(`}`)
//                   .writeLine(`currNewIndex++`)
//               })
//               .writeLine(`} // end of while inside else`)
//               .blankLine()
//               .writeLine(`const keys = Object.keys(backlog)`)
//               .writeLine(`for (let i = 0; i < keys.length; i++) {`)
//               .indentBlock(() => {
//                 this.writer
//                   .writeLine(`const k = keys[i]`)
//                   .writeLine(`if (backlog[k] == null) continue`)
//                   .writeLine(`this.destroyView(k)`)
//                   .writeLine(`this.positions[k] = undefined`)
//                   .writeLine(`this.commentsDict[k] = undefined`)
//               })
//               .writeLine(`}`)
//           })
//           .writeLine(`}`)
//           .blankLine()
//       })
//       .writeLine(`},`)
//
//     return this
//   }
//
//   private generateDestroyViewMethod (fa: RepeatingViewFactoryAnalyzer): this {
//     this.writer
//       .writeLine(`destroy() {`)
//       .indentBlock(() => {
//
//       })
//       .writeLine(`},`)
//     return this
//   }
//
//   private generateFactory (fa: RepeatingViewFactoryAnalyzer): this {
//     const args = Array.from(fa.getNamesOfBindingsWhichUseViewScope())
//       .map((name, i) => `index_for_${name}_${i}`)
//       .join(`, `)
//
//     this.writer
//       .writeLine(`export default (${args}) => ({`)
//       .indentBlock(() => {
//         this.writer
//         // .writeLine(`children_: [],`)
//           .writeLine(`prevStates: {}, // maps a key value to prev state`)
//         this
//           .generateInitMethod(fa)
//           .generateUpdateViewMethod(fa)
//           .generateDestroyViewMethod(fa)
//           .generateCreateView(fa)
//           .generateViewDiff(fa)
//           .generateUpdateView(fa)
//           .generateDestroyView(fa)
//       })
//       .writeLine(`})`)
//     return this
//   }
//
//   public printCode (fa: RepeatingViewFactoryAnalyzer): CodeBlockWriter {
//     return this
//       .resetWriter()
//       .printImports(fa)
//       .generateFactory(fa)
//       .getWriter()
//   }
//
// }
