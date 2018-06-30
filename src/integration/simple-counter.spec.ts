// import { getProjectAnalyzer } from '../compiler/compile'
// import * as path from 'path'
// import { and, isCmpNodeWithName, isTextNode } from '../compiler/template-nodes/nodes/utils'
// import { stripIndent } from 'common-tags'
// import { ComponentFactoryAnalyzer } from '../compiler/analyzer/factory-analyzer/component-factory-analyzer'
// import {
//   ComponentInputBinding,
//   ComponentOutputBinding,
//   InterpolationBinding,
// } from '../compiler/template-nodes/view-bindings'
// import { isFirstChild, isLastChild } from '../compiler/utils/tree'
// import CodeBlockWriter from 'code-block-writer'
// import { ViewBoundConstant } from '../compiler/template-nodes/view-bound-value'
//
// function getPathToTestApp (testAppName: string): string {
//   return path.join(__dirname.replace('/dist/', '/src/'), 'apps', testAppName)
// }
//
// const projectAnalyzer = getProjectAnalyzer({ dir: getPathToTestApp('simple-counter') })
// const entryFa = projectAnalyzer.getFactoryByName(`EntryCmp0`) as ComponentFactoryAnalyzer
// const counterFa = projectAnalyzer.getFactoryByName(`CounterCmp1`) as ComponentFactoryAnalyzer
//
// describe(`Simple CounterCmp application`, () => {
//
//   describe(`Entry Component`, () => {
//
//     it(`should have a name with id 0`, () => {
//       expect(entryFa.getFactoryName()).toBe(`EntryCmp0`)
//     })
//
//     it(`should have one child`, () => {
//       expect(Array.from(entryFa.getChildrenFactories()).length).toBe(1)
//     })
//
//     describe(`View`, () => {
//
//       it(`should have the correct structure`, () => {
//         expect(entryFa.view.printIndented()).toEqual(stripIndent`
//           [Text] \\n
//           [Component] <counter-cmp>
//           [Text] \\n
//         `)
//       })
//
//       const text1 = entryFa.view.findOrFail(and(isTextNode, isFirstChild)).getValueOrThrow()
//       const cmp = entryFa.view.findOrFail(isCmpNodeWithName('counter-cmp')).getValueOrThrow()
//       const text2 = entryFa.view.findOrFail(and(isTextNode, isLastChild)).getValueOrThrow()
//
//       describe(`first text node`, () => {
//
//         it(`should initialize with the text`, () => {
//           expect(text1.printDomInit()).toEqual([
//             `util.__wane__createTextNode('\\n  ')`,
//           ])
//         })
//
//         it(`should print no binding init`, () => {
//           const wr = new CodeBlockWriter()
//           text1.printBindingsInit(wr)
//           expect(wr.toString()).toBe('')
//         })
//
//         it(`should print no updates since it cannot be updated`, () => {
//           const wr = new CodeBlockWriter()
//           text1.printBindingsUpdate(wr)
//           expect(wr.toString()).toBe('')
//         })
//
//         it(`should have a single binding of type InterpolationBinding`, () => {
//           const bindings = Array.from(text1.viewBindings)
//           expect(bindings.length).toBe(1)
//           expect(bindings[0] instanceof InterpolationBinding).toBe(true)
//         })
//
//         describe(`InterpolationBinding`, () => {
//           const binding = text1.getBinding()
//
//           it(`should print no init`, () => {
//             const wr = new CodeBlockWriter()
//             binding.printInit(wr, 'this')
//             expect(wr.toString()).toBe(``)
//           })
//
//           it(`should print no update because it's a constant`, () => {
//             const wr = new CodeBlockWriter()
//             binding.printUpdate(wr, `node`)
//             expect(wr.toString()).toBe(``)
//           })
//
//         })
//
//         describe(`BoundValue`, () => {
//           const boundValue = text1.getBinding().boundValue
//
//           it(`should be a ViewBoundConstant`, () => {
//             expect(boundValue instanceof ViewBoundConstant).toBe(true)
//           })
//
//           it(`should have EntryCmp as scope factory`, () => {
//             expect(boundValue.getDefinitionFactory()).toBe(entryFa)
//           })
//
//           it(`should resolve to the text it contains (some whitespace)`, () => {
//             expect(boundValue.resolve()).toBe(`'\\n  '`)
//             expect(boundValue.resolve(counterFa)).toBe(`'\\n  '`)
//           })
//
//           it(`should be a constant`, () => {
//             expect(boundValue.isConstant()).toBe(true)
//           })
//
//         })
//
//       })
//
//       describe(`the component node`, () => {
//
//         it(`should initialize the html node`, () => {
//           expect(cmp.printDomInit()).toEqual([
//             `util.__wane__createElement('counter-cmp')`,
//           ])
//         })
//
//         it(`should print no binding init because nothing is bound to the dom`, () => {
//
//         })
//
//         it(`should print a way to update the model (relative from Entry to CounterCmp)`, () => {
//           const wr = new CodeBlockWriter()
//           cmp.printBindingsUpdate(wr)
//           expect(wr.toString()).toBe(``)
//         })
//
//         it(`should have no attribute bindings`, () => {
//           const attributeBindings = Array.from(cmp.getAttributeBindings())
//           expect(attributeBindings.length).toEqual(0)
//         })
//
//         describe(`ComponentInputBinding`, () => {
//
//           it(`only one should exist`, () => {
//             const bindings = Array.from(cmp.getInputBindings())
//             expect(bindings.length).toBe(1)
//             expect(bindings[0] instanceof ComponentInputBinding).toBe(true)
//           })
//
//           it(`should print initialization from the entry component`, () => {
//             const [binding] = cmp.getInputBindings()
//             const wr = new CodeBlockWriter()
//             binding.printInit(wr, `instance`, entryFa)
//             expect(wr.toString()).toBe(`instance.value = this.__wane__data.counter`)
//           })
//
//           it(`should print initialization from the counter component`, () => {
//             const [binding] = cmp.getInputBindings()
//             const wr = new CodeBlockWriter()
//             binding.printInit(wr, `instance`, counterFa)
//             expect(wr.toString()).toBe(`instance.value = this.__wane__factoryParent.__wane__data.counter`)
//           })
//
//           it(`should print update from the entry component`, () => {
//             const [binding] = cmp.getInputBindings()
//             const wr = new CodeBlockWriter()
//             binding.printUpdate(wr, `instance`, entryFa)
//             expect(wr.toString()).toBe(`instance.value = this.__wane__data.counter`)
//           })
//
//           it(`should print update from the counter component`, () => {
//             const [binding] = cmp.getInputBindings()
//             const wr = new CodeBlockWriter()
//             binding.printUpdate(wr, `instance`, counterFa)
//             expect(wr.toString()).toBe(`instance.value = this.__wane__factoryParent.__wane__data.counter`)
//           })
//
//         })
//
//         describe(`ComponentOutputBinding`, () => {
//
//           it(`only one should exist`, () => {
//             const bindings = Array.from(cmp.getOutputBindings())
//             expect(bindings.length).toBe(1)
//             expect(bindings[0] instanceof ComponentOutputBinding).toBe(true)
//           })
//
//           it(`should print initialization from the entry component`, () => {
//             const [binding] = cmp.getOutputBindings()
//             const wr = new CodeBlockWriter({ indentNumberOfSpaces: 2 })
//             binding.printInit(wr, `instance`)
//             expect(wr.toString()).toBe(stripIndent`
//               instance.valueChange = (__wane__placeholder) => {
//                 this.__wane__data.onCounterChange(__wane__placeholder)
//               }
//             `)
//           })
//
//           it(`should print nothing for updates`, () => {
//             const [binding] = cmp.getOutputBindings()
//             const wr = new CodeBlockWriter()
//             binding.printUpdate(wr, `instance`)
//             expect(wr.toString()).toBe(``)
//           })
//
//         })
//
//       })
//
//     })
//
//     it(`should connect the correct view node to a factory child`, () => {
//       const cmpViewNode = entryFa.view.findOrFail(isCmpNodeWithName('counter-cmp'))
//       expect(Array.from(entryFa.getChildren())).toEqual([
//         [cmpViewNode!, counterFa],
//       ])
//     })
//
//     describe(`getNamesOfMethodsDefinedOnParentWhichCanBeCalledByCalling()`, () => {
//       it(`"onCounterChange" should be empty (this is root)`, () => {
//         const names = entryFa.getNamesOfMethodsDefinedOnParentWhichCanBeCalledByCalling('onCounterChange')
//         expect(Array.from(names).length).toBe(0)
//       })
//     })
//
//     describe(`canUpdatePropInThisComponentInstanceByCalling`, () => {
//       it(`"onCounterChange" can update "counter" (which is bound to the child component)`, () => {
//         expect(entryFa.canUpdatePropInThisComponentInstanceByCalling('onCounterChange')).toBe(true)
//       })
//     })
//
//     describe(`getPropAndGetterNames`, () => {
//       it(`should return the only prop, "counter"`, () => {
//         expect(entryFa.getPropAndGetterNames()).toEqual(new Set(['counter']))
//       })
//     })
//
//     describe(`getMethodNames`, () => {
//       it(`should return the only method, "onCounterChange"`, () => {
//         expect(entryFa.getMethodNames()).toEqual(new Set(['onCounterChange']))
//       })
//     })
//
//     describe(`hasDefinedAndResolvesTo`, () => {
//       it(`should report that it has the "counter" property defined`, () => {
//         expect(entryFa.hasDefinedAndResolvesTo(`counter`)).toBe(true)
//       })
//       it(`should report that it has the "onCounterChange" method defined`, () => {
//         expect(entryFa.hasDefinedAndResolvesTo(`onCounterChange`)).toBe(true)
//       })
//       it(`should report that "value" is not defined on this component`, () => {
//         expect(entryFa.hasDefinedAndResolvesTo(`value`)).toBe(false)
//       })
//     })
//
//     // describe(`getBoundValues`, () => {
//     //   const boundValues = entryFa.getBoundValues()
//     //
//     //   it(`should contain "value" bound to interpolation node in "counter-cmp"`, () => {
//     //     const interpolationNode = counterFa.view.findOrFail(isInterpolationNodeWithProp('value'))
//     //     const counterCmpNode = entryFa.view.findOrFail(isCmpNodeWithName('counter-cmp'))
//     //     const interpolation = interpolationNode.getValueOrThrow().getBinding().boundValue
//     //     const [component, ...rest] = iterare(counterCmpNode.getValueOrThrow().viewBindings)
//     //       .filter(isInstance(ComponentInputBinding))
//     //       .map(inputBinding => inputBinding.boundValue)
//     //     expect(rest.length).toBe(0)
//     //     expect(boundValues.size).toBe(2)
//     //     console.log(iterare(boundValues).map(bv => bv.getViewBinding().getTemplateNode().toString()).toArray())
//     //     expect(boundValues.has(interpolation)).toBe(true, `interpolation`)
//     //     expect(boundValues.has(component)).toBe(true, `component`)
//     //   })
//     // })
//
//     describe(`getMethodsThatAreInvokedByOutput`, () => {
//       it(`should get an empty iterable trying to get whatever because there's no outputs`, () => {
//         expect(Array.from(entryFa.getMethodsThatAreInvokedByOutput('foo'))).toEqual([])
//       })
//     })
//
//   })
//
//   describe(`CounterCmp component`, () => {
//
//     it(`should have a name with id 1`, () => {
//       expect(counterFa.getFactoryName()).toBe(`CounterCmp1`)
//     })
//
//     it(`should have no children`, () => {
//       expect(Array.from(counterFa.getChildrenFactories()).length).toBe(0)
//     })
//
//     it(`should correctly conclude the structure of the view`, () => {
//       expect(counterFa.view.printIndented()).toEqual(stripIndent`
//         [Text] \\n
//         [Html] <span>
//           [Text] {{ value }}
//         [Text] \\n
//         [Html] <button>
//           [Text] Inc
//         [Text] \\n
//         [Html] <button>
//           [Text] Dec
//         [Text] \\n
//       `)
//     })
//
//     it(``, () => {
//       expect(Array.from(counterFa.getChildren())).toEqual([])
//     })
//
//     describe(`getNamesOfMethodsDefinedOnParentWhichCanBeCalledByCalling()`, () => {
//       it(`"onIncClick" and "onDecClick" should be empty (this is root)`, () => {
//         const incNames = counterFa.getNamesOfMethodsDefinedOnParentWhichCanBeCalledByCalling('onIncClick')
//         const decNames = counterFa.getNamesOfMethodsDefinedOnParentWhichCanBeCalledByCalling('onDecClick')
//         expect(Array.from(incNames).length).toBe(0)
//         expect(Array.from(decNames).length).toBe(0)
//       })
//     })
//
//     describe(`canUpdatePropInThisComponentInstanceByCalling`, () => {
//       it(`"onIncClick" does not update anything (only emits)`, () => {
//         expect(counterFa.canUpdatePropInThisComponentInstanceByCalling('onIncClick')).toBe(false)
//       })
//       it(`"onDecClick" does not update anything (only emits)`, () => {
//         expect(counterFa.canUpdatePropInThisComponentInstanceByCalling('onDecClick')).toBe(false)
//       })
//     })
//
//     describe(`hasDefinedAndResolvesTo`, () => {
//       it(`returns true for "value"`, () => {
//         expect(counterFa.hasDefinedAndResolvesTo('value')).toBe(true)
//       })
//       it(`returns true for "valueChange"`, () => {
//         expect(counterFa.hasDefinedAndResolvesTo('valueChange')).toBe(true)
//       })
//       it(`returns true for "onIncClick"`, () => {
//         expect(counterFa.hasDefinedAndResolvesTo('onIncClick')).toBe(true)
//       })
//       it(`returns true for "onDecClick"`, () => {
//         expect(counterFa.hasDefinedAndResolvesTo('onDecClick')).toBe(true)
//       })
//       it(`returns false for "counter"`, () => {
//         expect(counterFa.hasDefinedAndResolvesTo('counter')).toBe(false)
//       })
//       it(`returns false for "onCounterChange"`, () => {
//         expect(counterFa.hasDefinedAndResolvesTo('onCounterChange')).toBe(false)
//       })
//     })
//
//     describe(`getPathTo`, () => {
//       it(`should get an empty path to itself`, () => {
//         expect(counterFa.getPathTo(counterFa)).toEqual([])
//       })
//       it(`should get a single-item path to the EntryCmp`, () => {
//         const path = counterFa.getPathTo(entryFa)
//         expect(path.length).toBe(1)
//         expect(path[0]).toBe(entryFa)
//       })
//     })
//
//     describe(`getParentHopCountToAncestor`, () => {
//       it(`should get hop count 0 to itself`, () => {
//         expect(counterFa.getParentHopCountToAncestor(counterFa)).toBe(0)
//       })
//       it(`should get hop count 1 to its parent`, () => {
//         expect(counterFa.getParentHopCountToAncestor(entryFa)).toBe(1)
//       })
//     })
//
//     describe(`getSelfBindings`, () => {
//       it(`gets two bindings, one input and one output`, () => {
//         const bindings = Array.from(counterFa.getSelfBindings())
//         expect(bindings.length).toBe(2)
//         expect(bindings.some(binding => binding instanceof ComponentInputBinding)).toBe(true)
//         expect(bindings.some(binding => binding instanceof ComponentOutputBinding)).toBe(true)
//       })
//       it(`sees the [value]="counter" component input binding`, () => {
//         const inputBinding = Array.from(counterFa.getSelfBindings())
//           .find(binding => binding instanceof ComponentInputBinding)!
//         inputBinding.boundValue.resolve()
//       })
//     })
//
//     describe(`getMethodsThatAreInvokedByOutput`, () => {
//       it(`maps "valueChange" output to "onCounterChange" method on "EntryCmp"`, () => {
//         const methods = Array.from(counterFa.getMethodsThatAreInvokedByOutput('valueChange'))
//         expect(methods.map(m => m.getName())).toEqual(['onCounterChange'])
//       })
//     })
//
//   })
//
// })
