import * as apps from './apps'
import {
  ComponentInputBinding,
  ComponentOutputBinding,
  ConditionalViewBinding,
  HtmlElementEventBinding,
  HtmlElementPropBinding,
  InterpolationBinding,
  TextBinding,
} from '../compiler/template-nodes/view-bindings'
import iterare from 'iterare'
import CodeBlockWriter from 'code-block-writer'
import {ViewBoundPropertyAccess, ViewBoundValue} from '../compiler/template-nodes/view-bound-value'
import {
  isCmpNodeWithName,
  isConditionalViewNodeWithVar,
} from '../compiler/template-nodes/nodes/utils'
import {isInstance} from '../compiler/utils/utils'
import {ComponentFactoryAnalyzer} from '../compiler/analyzer/factory-analyzer/component-factory-analyzer'
import {repeat} from './utils'
import {FactoryAnalyzer} from '../compiler/analyzer'
import {TemplateNodeValue} from '../compiler/template-nodes/nodes/template-node-value-base'
import {ConditionalViewFactoryAnalyzer} from '../compiler/analyzer/factory-analyzer/conditional-view-factory-analyzer'
import {TemplateNodeComponentValue} from '../compiler/template-nodes/nodes/component-node'
import {TemplateNodeConditionalViewValue} from '../compiler/template-nodes/nodes/conditional-view-node'

function expectWriter (spy: (wr: CodeBlockWriter) => void, expectation: string): void {
  const wr = new CodeBlockWriter({indentNumberOfSpaces: 2})
  spy(wr)
  expect(wr.toString().trim()).toBe(expectation.trim())
}

export function get01Factories () {
  const app = apps.helloWorld.getFactoryTree()
  return {app}
}

export function get02Factories () {
  const app = apps.counter.getFactoryTree()
  const appChildren = [...app.getChildrenFactories()]
  const counterCmp = appChildren[0] as ComponentFactoryAnalyzer
  return {app, counterCmp}
}

export function get03Factories () {
  const app = apps.toggler.getFactoryTree()

  const appChildren = [...app.getChildrenFactories()]
  const toggleCmp = appChildren[0] as ComponentFactoryAnalyzer
  const isJavaScriptCondDir = appChildren[1] as ConditionalViewFactoryAnalyzer
  const isTypeScriptCondDir = appChildren[2] as ConditionalViewFactoryAnalyzer

  const isJavaScriptPartial = isJavaScriptCondDir.getPartialViewFactoryAnalyzer()
  const isTypeScriptPartial = isTypeScriptCondDir.getPartialViewFactoryAnalyzer()

  return {
    app, toggleCmp,
    isJavaScriptCondDir, isTypeScriptCondDir,
    isJavaScriptPartial, isTypeScriptPartial,
  }
}

export function get04Factories () {
  const app = apps.comparator.getFactoryTree()

  const appChildren = [...app.getChildrenFactories()]
  const counterCmp1 = appChildren[0] as ComponentFactoryAnalyzer
  const counterCmp2 = appChildren[1] as ComponentFactoryAnalyzer

  const infoCmp = appChildren[2] as ComponentFactoryAnalyzer
  const infoCmpChildren = [...infoCmp.getChildrenFactories()]

  const isLeftGreaterCondDir = infoCmpChildren[0] as ConditionalViewFactoryAnalyzer
  const isRightGreaterCondDir = infoCmpChildren[1] as ConditionalViewFactoryAnalyzer
  const areEqualCondDir = infoCmpChildren[2] as ConditionalViewFactoryAnalyzer

  const isLeftGreaterPartial = isLeftGreaterCondDir.getPartialViewFactoryAnalyzer()
  const isRightGreaterPartial = isRightGreaterCondDir.getPartialViewFactoryAnalyzer()
  const areEqualPartial = areEqualCondDir.getPartialViewFactoryAnalyzer()

  return {
    app,
    counterCmp1, counterCmp2, infoCmp,
    isLeftGreaterCondDir, isRightGreaterCondDir, areEqualCondDir,
    isLeftGreaterPartial, isRightGreaterPartial, areEqualPartial,
  }
}

export function get05Factories () {
  const app = apps.deepIfs.getFactoryTree()

  const counterCmps = [...app.getChildrenFactories()].slice(0, 3) as ComponentFactoryAnalyzer[]
  const [counterCmp1, counterCmp2, counterCmp3] = counterCmps

  const toggleCmps = [...app.getChildrenFactories()].slice(3, 6) as ComponentFactoryAnalyzer[]
  const [toggleCmp1, toggleCmp2, toggleCmp3] = toggleCmps

  const [ifA] = [...app.getChildrenFactories()].slice(6, 7) as ConditionalViewFactoryAnalyzer[]
  const ifAPartial = ifA.getPartialViewFactoryAnalyzer()

  const [ifB] = ifAPartial.getChildrenFactories() as ConditionalViewFactoryAnalyzer[]
  const ifBPartial = ifB.getPartialViewFactoryAnalyzer()

  const [ifC] = ifBPartial.getChildrenFactories() as ConditionalViewFactoryAnalyzer[]
  const ifCPartial = ifC.getPartialViewFactoryAnalyzer()

  return {
    app,
    counterCmps, counterCmp1, counterCmp2, counterCmp3,
    toggleCmps, toggleCmp1, toggleCmp2, toggleCmp3,
    ifA, ifB, ifC,
    ifAPartial, ifBPartial, ifCPartial,
  }
}

describe(`FactoryAnalyzer`, () => {


  describe(`getFirstScopeBoundaryUpwardsIncludingSelf`, () => {

    describe(`in 01-hello-world`, () => {
      const fas = get01Factories()
      describe(`for App`, () => {
        it(`gets itself`, () => {
          expect(fas.app.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(fas.app)
        })
      })
    })

    describe(`in 02-counter`, () => {
      const fas = get02Factories()
      describe(`for CounterCmp`, () => {
        it(`gets itself`, () => {
          expect(fas.counterCmp.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(fas.counterCmp)
        })
      })
      describe(`for App`, () => {
        it(`gets itself`, () => {
          expect(fas.app.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(fas.app)
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const fas = get03Factories()
      describe(`for ToggleCmp`, () => {
        it(`returns App`, () => {
          expect(fas.toggleCmp.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(fas.toggleCmp)
        })
      })
      describe(`for ConditionalView1`, () => {
        it(`returns App`, () => {
          expect(fas.isJavaScriptCondDir.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(fas.app)
        })
      })
      describe(`for ConditionalView2`, () => {
        it(`returns App`, () => {
          expect(fas.isTypeScriptCondDir.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(fas.app)
        })
      })
      describe(`for App`, () => {
        it(`returns itself`, () => {
          expect(fas.app.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(fas.app)
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const fas = get04Factories()
      describe(`for CounterCmp1`, () => {
        it(`returns itself`, () => {
          expect(fas.counterCmp1.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(fas.counterCmp1)
        })
      })
      describe(`for CounterCmp2`, () => {
        it(`returns itself`, () => {
          expect(fas.counterCmp2.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(fas.counterCmp2)
        })
      })
      describe(`for IsLeftGreater`, () => {
        it(`returns Info`, () => {
          expect(fas.isLeftGreaterCondDir.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(fas.infoCmp)
        })
      })
      describe(`for IsRightGreater`, () => {
        it(`returns Info`, () => {
          expect(fas.isRightGreaterCondDir.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(fas.infoCmp)
        })
      })
      describe(`for AreEqual`, () => {
        it(`returns Info`, () => {
          expect(fas.areEqualCondDir.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(fas.infoCmp)
        })
      })
      describe(`for InfoCmp`, () => {
        it(`returns itself`, () => {
          expect(fas.infoCmp.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(fas.infoCmp)
        })
      })
      describe(`for App`, () => {
        it(`returns itself`, () => {
          expect(fas.app.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(fas.app)
        })
      })
    })

    describe(`in 05-deep-ifs`, () => {
      const fas = get05Factories()
      describe(`for ToggleCmp components`, () => {
        it(`returns itself`, () => {
          for (const toggleCmp of fas.toggleCmps) {
            expect(toggleCmp.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(toggleCmp)
          }
        })
      })
      describe(`for CounterCmp components`, () => {
        it(`returns itself`, () => {
          for (const counterCmp of fas.counterCmps) {
            expect(counterCmp.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(counterCmp)
          }
        })
      })
      describe(`for w:if with condition "visibility.a"`, () => {
        it(`returns App`, () => {
          expect(fas.ifA.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(fas.app)
        })
      })
      describe(`for w:if with condition "visibility.b"`, () => {
        it(`returns App`, () => {
          expect(fas.ifB.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(fas.app)
        })
      })
      describe(`for w:if with condition "visibility.c"`, () => {
        it(`returns App`, () => {
          expect(fas.ifC.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(fas.app)
        })
      })
      describe(`for App component`, () => {
        it(`returns itself`, () => {
          expect(fas.app.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(fas.app)
        })
      })
    })

  })


  describe(`getFactoryName`, () => {

    describe(`01-hello-world`, () => {
      const fas = get01Factories()
      describe(`App`, () => {
        it(`gets class name appended by a number`, () => {
          expect(fas.app.getFactoryName()).toMatch(/App\d+/)
        })
      })
    })

    describe(`02-counter`, () => {
      const fas = get02Factories()
      describe(`CounterCmp`, () => {
        it(`gets class name appended by a number`, () => {
          expect(fas.counterCmp.getFactoryName()).toMatch(/Counter\d+/)
        })
      })
      describe(`App`, () => {
        it(`gets class name appended by a number`, () => {
          expect(fas.app.getFactoryName()).toMatch(/App\d+/)
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const fas = get03Factories()
      describe(`for ToggleCmp`, () => {
        it(`gets class name appended by a number`, () => {
          expect(fas.toggleCmp.getFactoryName()).toMatch(/Toggle\d+/)
        })
      })
      describe(`for ConditionalView1`, () => {
        it(`gets type appended by isJavaScript and a number`, () => {
          expect(fas.isJavaScriptCondDir.getFactoryName()).toMatch(/ConditionalView_isJavaScript_\d+/)
        })
      })
      describe(`for ConditionalView2`, () => {
        it(`gets type appended by isTypeScript and a number`, () => {
          expect(fas.isTypeScriptCondDir.getFactoryName()).toMatch(/ConditionalView_isTypeScript_\d+/)
        })
      })
      describe(`for App`, () => {
        it(`gets class name appended by a number`, () => {
          expect(fas.app.getFactoryName()).toMatch(/App\d+/)
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const fas = get04Factories()
      describe(`for CounterCmp1`, () => {
        it(`gets class name with a unique suffix`, () => {
          expect(fas.counterCmp1.getFactoryName()).toMatch(/Counter\d+/)
        })
      })
      describe(`for CounterCmp2`, () => {
        it(`gets class name with a unique suffix`, () => {
          expect(fas.counterCmp2.getFactoryName()).toMatch(/Counter\d+/)
        })
      })
      describe(`for IsLeftGreater`, () => {
        it(`gets type, condition and a unique suffix`, () => {
          expect(fas.isLeftGreaterCondDir.getFactoryName()).toMatch(/ConditionalView_isLeftGreater_\d+/)
        })
      })
      describe(`for IsRightGreater`, () => {
        it(`gets type, condition and a unique suffix`, () => {
          expect(fas.isRightGreaterCondDir.getFactoryName()).toMatch(/ConditionalView_isRightGreater_\d+/)
        })
      })
      describe(`for AreEqual`, () => {
        it(`gets type, condition and a unique suffix`, () => {
          expect(fas.areEqualCondDir.getFactoryName()).toMatch(/ConditionalView_areEqual_\d+/)
        })
      })
      describe(`for InfoCmp`, () => {
        it(`gets class name with a unique suffix`, () => {
          expect(fas.infoCmp.getFactoryName()).toMatch(/Info\d+/)
        })
      })
      describe(`for App`, () => {
        it(`gets class name with a unique suffix`, () => {
          expect(fas.app.getFactoryName()).toMatch(/App\d+/)
        })
      })
    })

    describe(`in 05-deep-ifs`, () => {
      const fas = get05Factories()
      describe(`for ToggleCmp components`, () => {
        for (const toggleCmp of fas.toggleCmps) {
          it(`gets class name with a unique suffix`, () => {
            expect(toggleCmp.getFactoryName()).toMatch(/Toggle\d+/)
          })
        }
      })
      describe(`for CounterCmp components`, () => {
        for (const counterCmp of fas.counterCmps) {
          it(`gets class name with a unique suffix`, () => {
            expect(counterCmp.getFactoryName()).toMatch(/Counter\d+/)
          })
        }
      })
      describe(`for w:if with condition "visibility.a"`, () => {
        it(`gets type, condition and a unique suffix`, () => {
          expect(fas.ifA.getFactoryName()).toMatch(/ConditionalView_visibility-a_\d+/)
        })
      })
      describe(`for w:if with condition "visibility.b"`, () => {
        it(`gets type, condition and a unique suffix`, () => {
          expect(fas.ifB.getFactoryName()).toMatch(/ConditionalView_visibility-b_\d+/)
        })
      })
      describe(`for w:if with condition "visibility.c"`, () => {
        it(`gets type, condition and a unique suffix`, () => {
          expect(fas.ifC.getFactoryName()).toMatch(/ConditionalView_visibility-c_\d+/)
        })
      })
      describe(`for App component`, () => {
        it(`gets class name with a unique suffix`, () => {
          expect(fas.app.getFactoryName()).toMatch(/App\d+/)
        })
      })
    })

  })


  describe(`getFactoryFilename`, () => {

    describe(`01-hello-world`, () => {
      describe(`App`, () => {
        const app = apps.helloWorld.getFactoryTree()
        it(`returns "app{N}"`, () => {
          expect(app.getFactoryFilename()).toMatch(/app\d+/)
        })
      })
    })

    describe(`02-counter`, () => {
      describe(`CounterCmp`, () => {
        const counter = apps.counter.getFactoryTree().getFirstChild()
        it(`returns counter-cmp{N}`, () => {
          expect(counter.getFactoryFilename()).toMatch(/counter\d+/)
        })
      })
      describe(`App`, () => {
        const app = apps.counter.getFactoryTree()
        it(`returns app{N}`, () => {
          expect(app.getFactoryFilename()).toMatch(/app\d+/)
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const app = apps.toggler.getFactoryTree()
      const [toggleCmp, conditionalView1, conditionalView2] = app.getChildrenFactories()
      describe(`for ToggleCmp`, () => {
        it(`returns toggle-cmp{N}`, () => {
          expect(toggleCmp.getFactoryFilename()).toMatch(/toggle\d+/)
        })
      })
      describe(`for ConditionalView1`, () => {
        it(`returns conditional-view-is-java-script-{N}`, () => {
          expect(conditionalView1.getFactoryFilename()).toMatch(/conditional-view-is-java-script-\d+/)
        })
      })
      describe(`for ConditionalView2`, () => {
        it(`returns conditional-view-is-type-script-{N}`, () => {
          expect(conditionalView2.getFactoryFilename()).toMatch(/conditional-view-is-type-script-\d+/)
        })
      })
      describe(`for App`, () => {
        it(`returns app{N}`, () => {
          expect(app.getFactoryFilename()).toMatch(/app\d+/)
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const app = apps.comparator.getFactoryTree()
      const [counterCmp1, counterCmp2, infoCmp] = app.getChildrenFactories()
      const [isLeftIsGreater, isRightIsGreater, areEqual] = infoCmp.getChildrenFactories()
      describe(`for CounterCmp1`, () => {
        it(`works`, () => {
          expect(counterCmp1.getFactoryFilename()).toMatch(/counter\d+/)
        })
      })
      describe(`for CounterCmp2`, () => {
        it(`works`, () => {
          expect(counterCmp2.getFactoryFilename()).toMatch(/counter\d+/)
        })
      })
      describe(`for IsLeftGreater`, () => {
        it(`works`, () => {
          expect(isLeftIsGreater.getFactoryFilename()).toMatch(/conditional-view-is-left-greater-\d+/)
        })
      })
      describe(`for IsRightGreater`, () => {
        it(`works`, () => {
          expect(isRightIsGreater.getFactoryFilename()).toMatch(/conditional-view-is-right-greater-\d+/)
        })
      })
      describe(`for AreEqual`, () => {
        it(`works`, () => {
          expect(areEqual.getFactoryFilename()).toMatch(/conditional-view-are-equal-\d+/)
        })
      })
      describe(`for InfoCmp`, () => {
        it(`works`, () => {
          expect(infoCmp.getFactoryFilename()).toMatch(/info\d+/)
        })
      })
      describe(`for App`, () => {
        it(`works`, () => {
          expect(app.getFactoryFilename()).toMatch(/app\d+/)
        })
      })
    })

    describe(`in 05-deep-ifs`, () => {
      const cmps = get05Factories()
      describe(`for ToggleCmp components`, () => {
        for (const toggleCmp of cmps.toggleCmps) {
          it(`gets class name with a unique suffix`, () => {
            expect(toggleCmp.getFactoryFilename()).toMatch(/toggle\d+/)
          })
        }
      })
      describe(`for CounterCmp components`, () => {
        for (const counterCmp of cmps.counterCmps) {
          it(`gets class name with a unique suffix`, () => {
            expect(counterCmp.getFactoryFilename()).toMatch(/counter\d+/)
          })
        }
      })
      describe(`for w:if with condition "visibility.a"`, () => {
        it(`gets type, condition and a unique suffix`, () => {
          expect(cmps.ifA.getFactoryFilename()).toMatch(/conditional-view-visibility-a-\d+/)
        })
      })
      describe(`for w:if with condition "visibility.b"`, () => {
        it(`gets type, condition and a unique suffix`, () => {
          expect(cmps.ifB.getFactoryFilename()).toMatch(/conditional-view-visibility-b-\d+/)
        })
      })
      describe(`for w:if with condition "visibility.c"`, () => {
        it(`gets type, condition and a unique suffix`, () => {
          expect(cmps.ifC.getFactoryFilename()).toMatch(/conditional-view-visibility-c-\d+/)
        })
      })
      describe(`for App component`, () => {
        it(`gets class name with a unique suffix`, () => {
          expect(cmps.app.getFactoryFilename()).toMatch(/app\d+/)
        })
      })
    })

  })


  describe(`getFactoryFilenameWithExtension`, () => {

    describe(`01-hello-world`, () => {
      describe(`App`, () => {
        const app = apps.helloWorld.getFactoryTree()
        it(`returns "app0.ts"`, () => {
          expect(app.getFactoryFilenameWithExtension()).toBe(`app0.ts`)
        })
      })
    })

    describe(`02-counter`, () => {
      describe(`CounterCmp`, () => {
        const counter = apps.counter.getFactoryTree().getFirstChild()
        it(`returns counter-cmp1.ts`, () => {
          expect(counter.getFactoryFilenameWithExtension()).toBe(`counter1.ts`)
        })
      })
      describe(`App`, () => {
        const app = apps.counter.getFactoryTree()
        it(`returns app0.ts`, () => {
          expect(app.getFactoryFilenameWithExtension()).toBe(`app0.ts`)
        })
      })
    })

    // No need for more for now

  })


  describe(`getParentOrUndefined`, () => {

    describe(`01-hello-world`, () => {
      describe(`App`, () => {
        const app = apps.helloWorld.getFactoryTree()
        it(`returns undefined since this is the root factory`, () => {
          expect(app.getParentOrUndefined()).toBeUndefined()
        })
      })
    })

    describe(`02-counter`, () => {
      describe(`CounterCmp`, () => {
        const app = apps.counter.getFactoryTree()
        const counter = app.getFirstChild()
        it(`returns app`, () => {
          expect(counter.getParentOrUndefined()).toBe(app)
        })
      })
      describe(`App`, () => {
        const app = apps.counter.getFactoryTree()
        it(`returns undefined since this is the root factory`, () => {
          expect(app.getParentOrUndefined()).toBeUndefined()
        })
      })
    })

    // This is already tested in the Project analyzer, when testing for the structure.

  })


  describe(`getParent`, () => {

    describe(`01-hello-world`, () => {
      describe(`App`, () => {
        const app = apps.helloWorld.getFactoryTree()
        it(`throws because there is no parent`, () => {
          expect(() => app.getParent()).toThrow()
        })
      })
    })

    describe(`02-counter`, () => {
      describe(`CounterCmp`, () => {
        const app = apps.counter.getFactoryTree()
        const counter = app.getFirstChild()
        it(`returns app`, () => {
          expect(counter.getParent()).toBe(app)
        })
      })
      describe(`App`, () => {
        const app = apps.counter.getFactoryTree()
        it(`throws because there is no parent`, () => {
          expect(() => app.getParent()).toThrow()
        })
      })
    })

    // This already tested in Project analyzer tests, when testing for the tree structure.

  })


  describe(`isRoot`, () => {

    describe(`01-hello-world`, () => {
      describe(`App`, () => {
        const app = apps.helloWorld.getFactoryTree()
        it(`returns true because it is root`, () => {
          expect(app.isRoot()).toBe(true)
        })
      })
    })

    describe(`02-counter`, () => {
      const app = apps.counter.getFactoryTree()
      const counter = app.getFirstChild()
      describe(`CounterCmp`, () => {
        it(`returns false because it is not root`, () => {
          expect(counter.isRoot()).toBe(false)
        })
      })
      describe(`App`, () => {
        it(`returns true because it is not root`, () => {
          expect(app.isRoot()).toBe(true)
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const app = apps.toggler.getFactoryTree()
      const [toggleCmp, conditionalView1, conditionalView2] = app.getChildrenFactories()
      describe(`for ToggleCmp`, () => {
        it(`returns false`, () => {
          expect(toggleCmp.isRoot()).toBe(false)
        })
      })
      describe(`for ConditionalView1`, () => {
        it(`returns false`, () => {
          expect(conditionalView1.isRoot()).toBe(false)
        })
      })
      describe(`for ConditionalView2`, () => {
        it(`returns false`, () => {
          expect(conditionalView2.isRoot()).toBe(false)
        })
      })
      describe(`for App`, () => {
        it(`returns true`, () => {
          expect(app.isRoot()).toBe(true)
        })
      })
    })

    // Enough.

  })


  describe(`getChildren`, () => {

    describe(`01-hello-world`, () => {
      const fas = get01Factories()
      describe(`App`, () => {
        it(`returns an empty iterable since there are no child factories`, () => {
          expect(Array.from(fas.app.getChildren()).length).toBe(0)
        })
      })
    })

    describe(`02-counter`, () => {
      const fas = get02Factories()
      describe(`CounterCmp`, () => {
        it(`returns an empty iterable since there are no child factories`, () => {
          expect([...fas.counterCmp.getChildren()].length).toBe(0)
        })
      })
      describe(`App`, () => {
        it(`returns a single child, mapping the corresponding node to it`, () => {
          const children = fas.app.getChildren()
          expect([...children].length).toBe(1)
          const [[node, child]] = children
          expect(node.getValue).toBe(fas.app.view.findOrFail(isCmpNodeWithName('Counter')).getValue)
          expect(child).toBe(fas.counterCmp)
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const fas = get03Factories()
      describe(`for ToggleCmp`, () => {
        it(`returns no children`, () => {
          expect(Array.from(fas.toggleCmp.getChildren()).length).toBe(0)
        })
      })
      describe(`for ConditionalView1`, () => {
        it(`returns one child, mapping the corresponding node`, () => {
          const children = [...fas.isJavaScriptCondDir.getChildren()]
          expect([...children].length).toBe(1)
          const [[node, child]] = children
          expect(node.getValue()).toBe(fas.app.view.findOrFail(isConditionalViewNodeWithVar('isJavaScript')).getValue())
          expect(child).toBe(fas.isJavaScriptPartial)
        })
      })
      describe(`for PartialView1`, () => {
        it(`returns no children`, () => {
          expect(fas.isJavaScriptPartial.getChildren().size).toBe(0)
        })
      })
      describe(`for ConditionalView2`, () => {
        it(`returns one child, mapping the corresponding node`, () => {
          const children = [...fas.isTypeScriptCondDir.getChildren()]
          expect([...children].length).toBe(1)
          const [[node, child]] = children
          expect(node.getValue()).toBe(fas.app.view.findOrFail(isConditionalViewNodeWithVar('isTypeScript')).getValue())
          expect(child).toBe(fas.isTypeScriptPartial)
        })
      })
      describe(`for PartialView2`, () => {
        it(`returns no children`, () => {
          expect(fas.isTypeScriptPartial.getChildren().size).toBe(0)
        })
      })
      describe(`for App`, () => {
        it(`has three children, mapping corresponding nodes`, () => {
          const children = fas.app.getChildren()
          expect(Array.from(children).length).toBe(3)
          const [[node1, child1], [node2, child2], [node3, child3]] = children
          expect(node1).toEqual(fas.app.view.findOrFail(isCmpNodeWithName('Toggle')))
          expect(child1).toBe(fas.toggleCmp)
          expect(node2).toEqual(fas.app.view.findOrFail(isConditionalViewNodeWithVar(`isJavaScript`)))
          expect(child2).toBe(fas.isJavaScriptCondDir)
          expect(node3).toEqual(fas.app.view.findOrFail(isConditionalViewNodeWithVar(`isTypeScript`)))
          expect(child3).toBe(fas.isTypeScriptCondDir)
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const fas = get04Factories()
      describe(`for CounterCmp1`, () => {
        it(`returns no children`, () => {
          expect([...fas.counterCmp1.getChildren()].length).toBe(0)
        })
      })
      describe(`for CounterCmp2`, () => {
        it(`returns no children`, () => {
          expect([...fas.counterCmp1.getChildren()].length).toBe(0)
        })
      })
      describe(`for IsLeftGreater`, () => {
        it(`returns a single child, mapping the correct node`, () => {
          const children = [...fas.isLeftGreaterCondDir.getChildren()]
          expect(children.length).toBe(1)
          const [[node, child]] = children
          expect(node.getValue()).toBe(fas.isLeftGreaterCondDir.getAnchorViewNode().getValue())
          expect(child).toBe(fas.isLeftGreaterPartial)
        })
      })
      describe(`for IsLeftGreater Partial`, () => [
        it(`returns no children`, () => [
          expect(fas.isLeftGreaterPartial.getChildren().size).toBe(0),
        ]),
      ])
      describe(`for IsRightGreater`, () => {
        it(`returns a single child, mapping the correct node`, () => {
          const children = [...fas.isRightGreaterCondDir.getChildren()]
          expect(children.length).toBe(1)
          const [[node, child]] = children
          expect(node.getValue()).toBe(fas.isRightGreaterCondDir.getAnchorViewNode().getValue())
          expect(child).toBe(fas.isRightGreaterPartial)
        })
      })
      describe(`for IsRightGreater Partial`, () => [
        it(`returns no children`, () => [
          expect(fas.isRightGreaterPartial.getChildren().size).toBe(0),
        ]),
      ])
      describe(`for AreEqual`, () => {
        it(`returns a single child, mapping the correct node`, () => {
          const children = [...fas.areEqualCondDir.getChildren()]
          expect(children.length).toBe(1)
          const [[node, child]] = children
          expect(node.getValue()).toBe(fas.areEqualCondDir.getAnchorViewNode().getValue())
          expect(child).toBe(fas.areEqualPartial)
        })
      })
      describe(`for AreEqual Partial`, () => {
        it(`returns no children`, () => {
          expect(Array.from(fas.areEqualPartial.getChildren()).length).toBe(0)
        })
      })
      describe(`for InfoCmp`, () => {
        it(`returns three children, mapping corresponding nodes`, () => {
          const children = fas.infoCmp.getChildren()
          expect(Array.from(children).length).toBe(3)
          const [[node1, child1], [node2, child2], [node3, child3]] = children
          expect(node1).toEqual(fas.infoCmp.view.findOrFail(isConditionalViewNodeWithVar('isLeftGreater')))
          expect(child1).toBe(fas.isLeftGreaterCondDir)
          expect(node2).toEqual(fas.infoCmp.view.findOrFail(isConditionalViewNodeWithVar(`isRightGreater`)))
          expect(child2).toBe(fas.isRightGreaterCondDir)
          expect(node3).toEqual(fas.infoCmp.view.findOrFail(isConditionalViewNodeWithVar(`areEqual`)))
          expect(child3).toBe(fas.areEqualCondDir)
        })
      })
      describe(`for App`, () => {
        it(`returns three children, mapping corresponding nodes`, () => {
          const children = fas.app.getChildren()
          expect(Array.from(children).length).toBe(3)
          const [[node1, child1], [node2, child2], [node3, child3]] = children
          expect(node1).toEqual(fas.app.view.getNthRoot(1))
          expect(child1).toBe(fas.counterCmp1)
          expect(node2).toEqual(fas.app.view.getNthRoot(3))
          expect(child2).toBe(fas.counterCmp2)
          expect(node3).toEqual(fas.app.view.findOrFail(isCmpNodeWithName(`Info`)))
          expect(child3).toBe(fas.infoCmp)
        })
      })
    })

    describe(`in 05-deep-ifs`, () => {
      const fas = get05Factories()
      describe(`for ToggleCmp components`, () => {
        it(`they have no children`, () => {
          for (const toggleCmp of fas.toggleCmps) {
            expect(toggleCmp.getChildren().size).toBe(0)
          }
        })
      })
      describe(`for CounterCmp components`, () => {
        it(`they have no children`, () => {
          for (const counterCmp of fas.counterCmps) {
            expect(counterCmp.getChildren().size).toBe(0)
          }
        })
      })
      describe(`for w:if with condition "visibility.a"`, () => {
        it(`has a single child`, () => {
          const children = fas.ifA.getChildren()
          expect(children.size).toBe(1)
        })
        describe(`its only child`, () => {
          it(`maps to partial view`, () => {
            const children = fas.ifA.getChildren()
            const [[node, child]] = children
            expect(node.getValue()).toBe(fas.ifA.getAnchorViewNode().getValue())
            expect(child).toEqual(fas.ifAPartial)
          })
          describe(`its only child`, () => {
            it(`maps w:if "visibility.b"`, () => {
              const children = fas.ifAPartial.getChildren()
              const [[node, child]] = children
              expect(node.getValue()).toBe(fas.ifA.view.getByChildPath(2).getValue())
              expect(child).toEqual(fas.ifB)
            })
          })
        })
      })
      describe(`for w:if with condition "visibility.b"`, () => {
        it(`has a single child`, () => {
          const children = fas.ifB.getChildren()
          expect(children.size).toBe(1)
        })
        describe(`its only child`, () => {
          it(`maps to partial view`, () => {
            const children = fas.ifB.getChildren()
            const [[node, child]] = children
            expect(node.getValue()).toBe(fas.ifB.getAnchorViewNode().getValue())
            expect(child).toEqual(fas.ifBPartial)
          })
          describe(`its only child`, () => {
            it(`maps w:if "visibility.b"`, () => {
              const children = fas.ifBPartial.getChildren()
              const [[node, child]] = children
              expect(node.getValue()).toBe(fas.ifB.view.getByChildPath(2).getValue())
              expect(child).toEqual(fas.ifC)
            })
          })
        })
      })
      describe(`for w:if with condition "visibility.c"`, () => {
        it(`has a single child`, () => {
          const children = fas.ifC.getChildren()
          expect(children.size).toBe(1)
        })
        describe(`its only child`, () => {
          it(`maps to partial view`, () => {
            const children = fas.ifC.getChildren()
            const [[node, child]] = children
            expect(node.getValue()).toBe(fas.ifC.getAnchorViewNode().getValue())
            expect(child).toEqual(fas.ifCPartial)
          })
          describe(`its only child`, () => {
            it(`has no children`, () => {
              const children = fas.ifCPartial.getChildren()
              expect(children.size).toBe(0)
            })
          })
        })
      })
      describe(`for App component`, () => {
        it(`has 7 children`, () => {
          expect(fas.app.getChildren().size).toBe(7)
        })
        describe(`first three children`, () => {
          it(`all map correct nodes to correct factories`, () => {
            const [first, second, third] = fas.app.getChildren()
            expect(first[0].getValue()).toBe(fas.app.view.getByChildPath(0, 3).getValue())
            expect(first[1]).toBe(fas.counterCmp1)
            expect(second[0].getValue()).toBe(fas.app.view.getByChildPath(0, 5).getValue())
            expect(second[1]).toBe(fas.counterCmp2)
            expect(third[0].getValue()).toBe(fas.app.view.getByChildPath(0, 7).getValue())
            expect(third[1]).toBe(fas.counterCmp3)
          })
        })
        describe(`second three children`, () => {
          it(`all map correct nodes to correct factories`, () => {
            const [, , , fourth, fifth, sixth] = fas.app.getChildren()
            expect(fourth[0].getValue()).toBe(fas.app.view.getByChildPath(0, 10).getValue())
            expect(fourth[1]).toBe(fas.toggleCmp1)
            expect(fifth[0].getValue()).toBe(fas.app.view.getByChildPath(0, 12).getValue())
            expect(fifth[1]).toBe(fas.toggleCmp2)
            expect(sixth[0].getValue()).toBe(fas.app.view.getByChildPath(0, 14).getValue())
            expect(sixth[1]).toBe(fas.toggleCmp3)
          })
        })
        describe(`the last child`, () => {
          it(`maps the correct node to the correct factory`, () => {
            const [, , , , , , [node, child]] = fas.app.getChildren()
            expect(node.getValue()).toBe(fas.app.view.getByChildPath(1).getValue())
            expect(child).toBe(fas.ifA)
          })
        })
      })
    })

  })


  describe(`hasChildren`, () => {

    describe(`01-hello-world`, () => {
      describe(`App`, () => {
        const app = apps.helloWorld.getFactoryTree()
        it(`returns false because duh`, () => [
          expect(app.hasChildren()).toBe(false),
        ])
      })
    })

    describe(`02-counter`, () => {
      const app = apps.counter.getFactoryTree()
      const counter = app.getFirstChild()
      describe(`CounterCmp`, () => {
        it(`returns false`, () => {
          expect(counter.hasChildren()).toBe(false)
        })
      })
      describe(`App`, () => {
        it(`returns true`, () => {
          expect(app.hasChildren()).toBe(true)
        })
      })
    })

    // Too trivial, enough for now.

  })


  describe(`getAnchorViewNode`, () => {

    describe(`01-hello-world`, () => {
      describe(`App`, () => {
        const app = apps.helloWorld.getFactoryTree()
        it(`throws because there is no anchor on the root`, () => {
          expect(() => app.getAnchorViewNode()).toThrow()
        })
      })
    })

    describe(`02-counter`, () => {
      const app = apps.counter.getFactoryTree()
      const counter = app.getFirstChild()
      describe(`CounterCmp`, () => {
        it(`returns the correct component view node`, () => {
          const expected = app.view.findOrFail(isCmpNodeWithName(`Counter`))
          expect(counter.getAnchorViewNode()).toEqual(expected)
        })
      })
      describe(`App`, () => {
        it(`throws because there is no anchor on the root`, () => {
          expect(() => app.getAnchorViewNode()).toThrow()
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const app = apps.toggler.getFactoryTree()
      const [toggleCmp, conditionalView1, conditionalView2] = app.getChildrenFactories()
      describe(`for ToggleCmp`, () => {
        it(`worsk`, () => {
          expect(toggleCmp.getAnchorViewNode()).toEqual(app.view.findOrFail(isCmpNodeWithName('Toggle')))
        })
      })
      describe(`for ConditionalView1`, () => {
        it(`works`, () => {
          expect(conditionalView1.getAnchorViewNode())
            .toEqual(app.view.findOrFail(isConditionalViewNodeWithVar(`isJavaScript`)))
        })
      })
      describe(`for ConditionalView2`, () => {
        it(`works`, () => {
          expect(conditionalView2.getAnchorViewNode())
            .toEqual(app.view.findOrFail(isConditionalViewNodeWithVar(`isTypeScript`)))
        })
      })
      describe(`for App`, () => {
        it(`works`, () => {
          expect(() => app.getAnchorViewNode()).toThrow()
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const app = apps.comparator.getFactoryTree()
      const [counterCmp1, counterCmp2, infoCmp] = app.getChildrenFactories()
      const [isLeftIsGreater, isRightIsGreater, areEqual] = infoCmp.getChildrenFactories()
      describe(`for CounterCmp1`, () => {
        it(`works`, () => {
          expect(counterCmp1.getAnchorViewNode()).toEqual(app.view.getNthRoot(1))
        })
      })
      describe(`for CounterCmp2`, () => {
        it(`works`, () => {
          expect(counterCmp2.getAnchorViewNode()).toEqual(app.view.getNthRoot(3))
        })
      })
      describe(`for IsLeftGreater`, () => {
        it(`works`, () => {
          expect(isLeftIsGreater.getAnchorViewNode())
            .toEqual(infoCmp.view.findOrFail(isConditionalViewNodeWithVar(`isLeftGreater`)))
        })
      })
      describe(`for IsRightGreater`, () => {
        it(`works`, () => {
          expect(isRightIsGreater.getAnchorViewNode())
            .toEqual(infoCmp.view.findOrFail(isConditionalViewNodeWithVar(`isRightGreater`)))
        })
      })
      describe(`for AreEqual`, () => {
        it(`works`, () => {
          expect(areEqual.getAnchorViewNode())
            .toEqual(infoCmp.view.findOrFail(isConditionalViewNodeWithVar(`areEqual`)))
        })
      })
      describe(`for InfoCmp`, () => {
        it(`works`, () => {
          expect(infoCmp.getAnchorViewNode()).toEqual(app.view.findOrFail(isCmpNodeWithName(`Info`)))
        })
      })
      describe(`for App`, () => {
        it(`throws`, () => {
          expect(() => app.getAnchorViewNode()).toThrow()
        })
      })
    })

    describe(`in 05-deep-ifs`, () => {
      const fas = get05Factories()
      describe(`for CounterCmp components`, () => {
        it(`works for the first ToggleCmp`, () => {
          expect(fas.counterCmp1.getAnchorViewNode().getValue())
            .toBe(fas.app.view.getByChildPath(0, 3).getValue() as TemplateNodeComponentValue)
        })
        it(`works for the second ToggleCmp`, () => {
          expect(fas.counterCmp2.getAnchorViewNode().getValue())
            .toBe(fas.app.view.getByChildPath(0, 5).getValue() as TemplateNodeComponentValue)
        })
        it(`works for the third ToggleCmp`, () => {
          expect(fas.counterCmp3.getAnchorViewNode().getValue())
            .toBe(fas.app.view.getByChildPath(0, 7).getValue() as TemplateNodeComponentValue)
        })
      })
      describe(`for ToggleCmp components`, () => {
        it(`works for the first CounterCmp`, () => {
          expect(fas.toggleCmp1.getAnchorViewNode().getValue())
            .toBe(fas.app.view.getByChildPath(0, 10).getValue() as TemplateNodeComponentValue)
        })
        it(`works for the second CounterCmp`, () => {
          expect(fas.toggleCmp2.getAnchorViewNode().getValue())
            .toBe(fas.app.view.getByChildPath(0, 12).getValue() as TemplateNodeComponentValue)
        })
        it(`works for the third CounterCmp`, () => [
          expect(fas.toggleCmp3.getAnchorViewNode().getValue())
            .toBe(fas.app.view.getByChildPath(0, 14).getValue() as TemplateNodeComponentValue),
        ])
      })
      describe(`for w:if with condition "visibility.a"`, () => {
        it(`works`, () => {
          expect(fas.ifA.getAnchorViewNode().getValue())
            .toBe(fas.app.view.getByChildPath(1).getValue() as TemplateNodeConditionalViewValue)
        })
      })
      describe(`for w:if with condition "visibility.b"`, () => {
        it(`works`, () => {
          expect(fas.ifB.getAnchorViewNode().getValue())
            .toBe(fas.ifA.view.getByChildPath(2).getValue() as TemplateNodeConditionalViewValue)
        })
      })
      describe(`for w:if with condition "visibility.c"`, () => {
        it(`works`, () => {
          expect(fas.ifC.getAnchorViewNode().getValue())
            .toBe(fas.ifB.view.getByChildPath(2).getValue() as TemplateNodeConditionalViewValue)
        })
      })
      describe(`for App component`, () => {
        it(`throws because it is the root`, () => {
          expect(() => fas.app.getAnchorViewNode().getValue()).toThrow()
        })
      })
    })

  })


  describe(`getAnchorViewNodeOrUndefined`, () => {

    describe(`01-hello-world`, () => {
      describe(`App`, () => {
        const app = apps.helloWorld.getFactoryTree()
        it(`returns undefined because there is no anchor on the root`, () => {
          expect(app.getAnchorViewNodeOrUndefined()).toBeUndefined()
        })
      })
    })

    describe(`02-counter`, () => {
      const app = apps.counter.getFactoryTree()
      const counter = app.getFirstChild()
      describe(`CounterCmp`, () => {
        it(`returns the correct component view node`, () => {
          expect(counter.getAnchorViewNodeOrUndefined())
            .toEqual(app.view.findOrFail(isCmpNodeWithName(`Counter`)))
        })
      })
      describe(`App`, () => {
        it(`returns undefined because there is no anchor on the root`, () => {
          expect(app.getAnchorViewNodeOrUndefined()).toBeUndefined()
        })
      })
    })

    // Too trivial compared to previous describe block. No need for more.

  })


  describe(`getPathTo`, () => {

    describe(`01-hello-world`, () => {
      describe(`App`, () => {
        const app = apps.helloWorld.getFactoryTree()
        it(`returns itself when going to itself`, () => {
          expect(app.getPathTo(app)).toEqual([app])
        })
      })
    })

    describe(`02-counter`, () => {
      const app = apps.counter.getFactoryTree()
      const counterCmp = app.getFirstChild()
      describe(`CounterCmp`, () => {
        it(`returns path [App] to itself`, () => {
          expect(counterCmp.getPathTo(counterCmp)).toEqual([counterCmp])
        })
        it(`returns path [CounterCmp -> App] to App`, () => {
          expect(counterCmp.getPathTo(app)).toEqual([counterCmp, app])
        })
      })
      describe(`App`, () => {
        it(`returns path [App] to itself`, () => {
          expect(app.getPathTo(app)).toEqual([app])
        })
        it(`returns [App -> CounterCmp] to CounterCmp`, () => {
          expect(app.getPathTo(counterCmp)).toEqual([app, counterCmp])
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const app = apps.toggler.getFactoryTree()
      const [toggleCmp, conditionalView1, conditionalView2] = app.getChildrenFactories()
      describe(`for ToggleCmp`, () => {
        it(`returns path [ToggleCmp] to itself`, () => {
          expect(toggleCmp.getPathTo(toggleCmp)).toEqual([toggleCmp])
        })
        it(`returns path [ToggleCmp -> App -> IsJavaScript] to JavaScript`, () => {
          expect(toggleCmp.getPathTo(conditionalView1)).toEqual([toggleCmp, app, conditionalView1])
        })
        it(`returns path [ToggleCmp -> App -> IsTypeScript] to TypeScript`, () => {
          expect(toggleCmp.getPathTo(conditionalView2)).toEqual([toggleCmp, app, conditionalView2])
        })
        it(`returns path [ToggleCmp -> App] to App`, () => {
          expect(toggleCmp.getPathTo(app)).toEqual([toggleCmp, app])
        })
      })
      describe(`for ConditionalView1`, () => {
        it(`returns path [IsJavaScript] to itself`, () => {
          expect(conditionalView1.getPathTo(conditionalView1)).toEqual([conditionalView1])
        })
        it(`returns path [IsJavaScript -> App -> IsTypeScript] to IsTypeScript`, () => {
          expect(conditionalView1.getPathTo(conditionalView2)).toEqual([conditionalView1, app, conditionalView2])
        })
        it(`returns path [IsJavaScript -> App -> ToggleCmp] to ToggleCmp`, () => {
          expect(conditionalView1.getPathTo(toggleCmp)).toEqual([conditionalView1, app, toggleCmp])
        })
        it(`returns path [IsJavaScript -> App] to App`, () => {
          expect(conditionalView1.getPathTo(app)).toEqual([conditionalView1, app])
        })
      })
      describe(`for App`, () => {
        it(`returns path [App] to itself`, () => {
          expect(app.getPathTo(app)).toEqual([app])
        })
        it(`returns path [App -> ToggleCmp] to ToggleCmp`, () => {
          expect(app.getPathTo(toggleCmp)).toEqual([app, toggleCmp])
        })
        it(`returns path [App -> IsJavaScript] to IsJavaScript`, () => {
          expect(app.getPathTo(conditionalView1)).toEqual([app, conditionalView1])
        })
        it(`returns path [App -> IsTypeScript] to IsTypeScript`, () => {
          expect(app.getPathTo(conditionalView2)).toEqual([app, conditionalView2])
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const app = apps.comparator.getFactoryTree()
      const [counterCmp1, counterCmp2, infoCmp] = app.getChildrenFactories()
      const [isLeftIsGreater, isRightIsGreater, areEqual] = infoCmp.getChildrenFactories()
      describe(`for CounterCmp1`, () => {
        it(`returns path [CounterCmp1 -> App -> InfoCmp] to InfoCmp`, () => [
          expect(counterCmp1.getPathTo(infoCmp)).toEqual([counterCmp1, app, infoCmp]),
        ])
      })
      describe(`for CounterCmp2`, () => {
        it(`returns path [CounterCmp2 -> App -> InfoCmp -> AreEqual] to AreEqual`, () => {
          expect(counterCmp2.getPathTo(areEqual)).toEqual([counterCmp2, app, infoCmp, areEqual])
        })
      })
      describe(`for IsLeftGreater`, () => {
        it(`returns path [IsLeftGreater -> InfoCmp -> App] to app`, () => {
          expect(isLeftIsGreater.getPathTo(app)).toEqual([isLeftIsGreater, infoCmp, app])
        })
      })
      describe(`for IsRightGreater`, () => {
        it(`returns [isRightGreater] to itself`, () => {
          expect(isRightIsGreater.getPathTo(isRightIsGreater)).toEqual([isRightIsGreater])
        })
      })
    })

    describe(`in 05-deep-ifs`, () => {
      const fas = get05Factories()
      describe(`for CounterCmp components`, () => {
        describe(`first`, () => {
          it(`returns [CounterCmp1 -> App -> ifA] to ifA`, () => {
            expect(fas.counterCmp1.getPathTo(fas.ifA)).toEqual([
              fas.counterCmp1,
              fas.app,
              fas.ifA,
            ])
          })
        })
        describe(`second`, () => {
          it(`returns [CounterCmp2 -> App -> ifA -> ifAPartial -> ifB -> ifBPartial] to ifBPartial`, () => {
            expect(fas.counterCmp2.getPathTo(fas.ifBPartial)).toEqual([
              fas.counterCmp2,
              fas.app,
              fas.ifA,
              fas.ifAPartial,
              fas.ifB,
              fas.ifBPartial,
            ])
          })
        })
      })
      describe(`for ToggleCmp components`, () => {
        describe(`third`, () => {
          it(`returns [ToggleCmp3 -> App -> ifA -> ifAPartial -> ifB -> ifBPartial -> ifC] to ifC`, () => {
            expect(fas.toggleCmp3.getPathTo(fas.ifC)).toEqual([
              fas.toggleCmp3,
              fas.app,
              fas.ifA,
              fas.ifAPartial,
              fas.ifB,
              fas.ifBPartial,
              fas.ifC,
            ])
          })
        })
      })
      describe(`for w:if with condition "visibility.a"`, () => {
        it(`returns [ifA -> App] to App`, () => {
          expect(fas.ifA.getPathTo(fas.app)).toEqual([fas.ifA, fas.app])
        })
      })
      describe(`for w:if partial with condition "visibility.a"`, () => {
        it(`returns [ifAPartial -> ifA -> App] to App`, () => {
          expect(fas.ifAPartial.getPathTo(fas.app)).toEqual([
            fas.ifAPartial,
            fas.ifA,
            fas.app,
          ])
        })
      })
      describe(`for w:if partial with condition "visibility.c"`, () => {
        it(`returns [ifCPartial -> ifC] to ifC`, () => {
          expect(fas.ifCPartial.getPathTo(fas.ifC)).toEqual([
            fas.ifCPartial,
            fas.ifC,
          ])
        })
        it(`returns [ifCPartial -> ifC -> ifBPartial] to ifBPartial`, () => {
          expect(fas.ifCPartial.getPathTo(fas.ifBPartial)).toEqual([
            fas.ifCPartial,
            fas.ifC,
            fas.ifBPartial,
          ])
        })
        it(`returns [ifCPartial -> ifC -> ifBPartial -> ifB -> ifAPartial -> ifA -> App] to App`, () => {
          expect(fas.ifCPartial.getPathTo(fas.app)).toEqual([
            fas.ifCPartial,
            fas.ifC,
            fas.ifBPartial,
            fas.ifB,
            fas.ifAPartial,
            fas.ifA,
            fas.app,
          ])
        })
      })
    })

  })


  describe(`isScopeBoundary`, () => {

    describe(`01-hello-world`, () => {
      describe(`App`, () => {
        const app = apps.helloWorld.getFactoryTree()
        it(`returns true because every component is a scope boundary`, () => [
          expect(app.isScopeBoundary()).toBe(true),
        ])
      })
    })

    describe(`02-counter`, () => {
      const app = apps.counter.getFactoryTree()
      const counter = app.getFirstChild()
      describe(`CounterCmp`, () => {
        it(`returns true because it's a component`, () => {
          expect(counter.isScopeBoundary()).toBe(true)
        })
      })
      describe(`App`, () => {
        it(`returns true because it's a component`, () => {
          expect(app.isScopeBoundary()).toBe(true)
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const app = apps.toggler.getFactoryTree()
      const [toggleCmp, conditionalView1, conditionalView2] = app.getChildrenFactories()
      describe(`for ToggleCmp`, () => {
        it(`returns true because it's a component`, () => {
          expect(toggleCmp.isScopeBoundary()).toBe(true)
        })
      })
      describe(`for ConditionalView1`, () => {
        it(`returns false because it's a conditional view`, () => {
          expect(conditionalView1.isScopeBoundary()).toBe(false)
        })
      })
      describe(`for ConditionalView2`, () => {
        it(`returns false because it's a conditional view`, () => {
          expect(conditionalView2.isScopeBoundary()).toBe(false)
        })
      })
      describe(`for App`, () => {
        it(`returns true because it's a component`, () => {
          expect(app.isScopeBoundary()).toBe(true)
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const app = apps.comparator.getFactoryTree()
      const [counterCmp1, counterCmp2, infoCmp] = app.getChildrenFactories()
      const [isLeftIsGreater, isRightIsGreater, areEqual] = infoCmp.getChildrenFactories()
      describe(`for CounterCmp1`, () => {
        it(`returns true because it's a component`, () => {
          expect(counterCmp1.isScopeBoundary()).toBe(true)
        })
      })
      describe(`for CounterCmp2`, () => {
        it(`returns true because it's a component`, () => {
          expect(counterCmp2.isScopeBoundary()).toBe(true)
        })
      })
      describe(`for IsLeftGreater`, () => {
        it(`returns false because it's a conditional view`, () => {
          expect(isLeftIsGreater.isScopeBoundary()).toBe(false)
        })
      })
      describe(`for IsRightGreater`, () => {
        it(`returns false because it's a conditional view`, () => {
          expect(isRightIsGreater.isScopeBoundary()).toBe(false)
        })
      })
      describe(`for AreEqual`, () => {
        it(`returns false because it's a conditional view`, () => {
          expect(areEqual.isScopeBoundary()).toBe(false)
        })
      })
      describe(`for InfoCmp`, () => {
        it(`returns true because it's a component`, () => {
          expect(infoCmp.isScopeBoundary()).toBe(true)
        })
      })
      describe(`for App`, () => {
        it(`returns true because it's a component`, () => {
          expect(app.isScopeBoundary()).toBe(true)
        })
      })
    })

    // Enough...

  })


  describe(`hasDefinedAndResolvesTo`, () => {

    describe(`in 01-hello-world`, () => {
      const fas = get01Factories()
      describe(`for App`, () => {
        it(`returns a constant for "greeting" because it's defined as a class prop which is a constant`, () => {
          expect(fas.app.hasDefinedAndResolvesTo(`greeting`)).toBe(`__wane__constants.App$greeting`)
        })
        it(`returns a constant for "someone" because it's defined as a class prop which is a constant`, () => {
          expect(fas.app.hasDefinedAndResolvesTo(`someone`)).toBe(`__wane__constants.App$someone`)
        })
        it(`returns null for "foo" because it's not defined as anything`, () => {
          expect(fas.app.hasDefinedAndResolvesTo(`foo`)).toBe(null)
        })
      })
    })

    describe(`in 02-counter`, () => {
      const fas = get02Factories()
      describe(`for CounterCmp`, () => {
        it(`returns itself for "value" because it's defined as an input`, () => {
          expect(fas.counterCmp.hasDefinedAndResolvesTo(`value`)).toBe(`__wane__data.value`)
        })
        it(`returns itself for "valueChange" because it's defined as an output`, () => {
          expect(fas.counterCmp.hasDefinedAndResolvesTo(`valueChange`)).toBe(`__wane__data.valueChange`)
        })
        it(`returns itself for "inc" because it's defined as a method`, () => {
          expect(fas.counterCmp.hasDefinedAndResolvesTo(`inc`)).toBe(`__wane__data.inc`)
        })
        it(`returns itself for "dec" because it's defined as a method`, () => {
          expect(fas.counterCmp.hasDefinedAndResolvesTo(`dec`)).toBe(`__wane__data.dec`)
        })
        it(`returns null for "count" because it's defined on the App`, () => {
          expect(fas.counterCmp.hasDefinedAndResolvesTo(`count`)).toBe(null)
        })
        it(`returns null for "onCountChange" because it's defined on App`, () => {
          expect(fas.counterCmp.hasDefinedAndResolvesTo(`onCountChange`)).toBe(null)
        })
        it(`returns null for "foo" because it's random`, () => {
          expect(fas.counterCmp.hasDefinedAndResolvesTo(`foo`)).toBe(null)
        })
      })
      describe(`for App`, () => {
        it(`returns itself for "count" because it's defined as a class prop`, () => {
          expect(fas.app.hasDefinedAndResolvesTo(`count`)).toBe(`__wane__data.count`)
        })
        it(`returns itself for "onCountChange" because it's defined as a class method`, () => {
          expect(fas.app.hasDefinedAndResolvesTo(`onCountChange`)).toBe(`__wane__data.onCountChange`)
        })
        it(`returns null for "value", "valueChange", "inc" and "dec" because those are defined on Counter`, () => {
          expect(fas.app.hasDefinedAndResolvesTo(`value`)).toBe(null)
          expect(fas.app.hasDefinedAndResolvesTo(`valueChange`)).toBe(null)
          expect(fas.app.hasDefinedAndResolvesTo(`inc`)).toBe(null)
          expect(fas.app.hasDefinedAndResolvesTo(`dec`)).toBe(null)
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const app = apps.toggler.getFactoryTree()
      const [toggleCmp, conditionalView1, conditionalView2] = app.getChildrenFactories()
      describe(`for ToggleCmp`, () => {
        it(`returns itself for "value" because it's defined as class prop`, () => {
          expect(toggleCmp.hasDefinedAndResolvesTo(`value`)).toBe(`__wane__data.value`)
        })
        it(`returns itself for "valueChange" because it's defined as a class method`, () => {
          expect(toggleCmp.hasDefinedAndResolvesTo(`valueChange`)).toBe(`__wane__data.valueChange`)
        })
        it(`returns itself for "changeState" because it's a class method`, () => {
          expect(toggleCmp.hasDefinedAndResolvesTo(`changeState`)).toBe(`__wane__data.changeState`)
        })
        it(`returns null for "bool" because that's defined on the parent`, () => {
          expect(toggleCmp.hasDefinedAndResolvesTo(`bool`)).toBe(null)
        })
      })
      describe(`for ConditionalView1`, () => {
        it(`returns null for isJavaScript even though that's its model, it's not defined there`, () => {
          expect(conditionalView1.hasDefinedAndResolvesTo(`isJavaScript`)).toBe(null)
        })
        it(`returns null for "bool", because it's defined on the parent`, () => {
          expect(conditionalView1.hasDefinedAndResolvesTo(`bool`)).toBe(null)
        })
      })
      describe(`for ConditionalView2`, () => {
        it(`returns null for isTypeScript even though that's its model, it's not defined there`, () => {
          expect(conditionalView2.hasDefinedAndResolvesTo(`isTypeScript`)).toBe(null)
        })
        it(`returns null for "bool", because it's defined on the parent`, () => {
          expect(conditionalView2.hasDefinedAndResolvesTo(`bool`)).toBe(null)
        })
      })
      describe(`for App`, () => {
        it(`returns itself for "bool" because it's a class prop`, () => {
          expect(app.hasDefinedAndResolvesTo(`bool`)).toBe(`__wane__data.bool`)
        })
        it(`returns itself for "onChange" because it's a class method`, () => {
          expect(app.hasDefinedAndResolvesTo(`onChange`)).toBe(`__wane__data.onChange`)
        })
        it(`returns itself for "isJavaScript" because it's a class getter`, () => {
          expect(app.hasDefinedAndResolvesTo(`isJavaScript`)).toBe(`__wane__data.isJavaScript`)
        })
        it(`returns itself for "isTypeScript" because it's a class getter`, () => {
          expect(app.hasDefinedAndResolvesTo(`isTypeScript`)).toBe(`__wane__data.isTypeScript`)
        })
        it(`returns null for "value" because that's defined on a child`, () => {
          expect(app.hasDefinedAndResolvesTo(`value`)).toBe(null)
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const app = apps.comparator.getFactoryTree()
      const [counterCmp1, counterCmp2, infoCmp] = app.getChildrenFactories()
      const [isLeftIsGreater, isRightIsGreater, areEqual] = infoCmp.getChildrenFactories()
      // TODO
      // describe(`for CounterCmp1`, () => {
      // })
      // TODO
      // describe(`for CounterCmp2`, () => {
      // })
      describe(`for IsLeftGreater`, () => {
        it(`returns null because it's not defined here (even though it's responsible for updating it in the dom)`, () => {
          expect(isLeftIsGreater.hasDefinedAndResolvesTo('isGreaterString')).toBe(null)
        })
        it(`returns null for "isLeftGreater" even though it uses it (it depends on it, but not responsible for it)`, () => {
          expect(isLeftIsGreater.hasDefinedAndResolvesTo('isLeftGreater')).toBe(null)
        })
      })
      describe(`for IsRightGreater`, () => {
        it(`returns null ebcause it's not defined here (even though it's responsible for updating the dom based on it)`, () => {
          expect(isRightIsGreater.hasDefinedAndResolvesTo('isGreaterString')).toBe(null)
        })
        it(`returns null for "isRightGreater" even though it uses it (it depends on it, but not responsible for it)`, () => {
          expect(isRightIsGreater.hasDefinedAndResolvesTo('isLeftGreater')).toBe(null)
        })
      })
      describe(`for AreEqual`, () => {
        it(`returns null for trying to access a thing which is not in its view`, () => {
          expect(areEqual.hasDefinedAndResolvesTo('isGreaterString')).toBe(null)
        })
        it(`returns null for "areEqual" even though it uses it (it depends on it, but not responsible for it)`, () => {
          expect(areEqual.hasDefinedAndResolvesTo('areEqual')).toBe(null)
        })
      })
      describe(`for InfoCmp`, () => {
        it(`returns itself for "isLeftGreater"`, () => {
          expect(infoCmp.hasDefinedAndResolvesTo('isLeftGreater')).toBe('__wane__data.isLeftGreater')
        })
        it(`returns itself for "areEqual"`, () => {
          expect(infoCmp.hasDefinedAndResolvesTo('areEqual')).toBe('__wane__data.areEqual')
        })
        it(`returns itself for "isGreaterString"`, () => {
          expect(infoCmp.hasDefinedAndResolvesTo('isGreaterString')).toBe('__wane__constants.Info$isGreaterString')
        })
      })
      describe(`for App`, () => {
        it(`returns itself for "left"`, () => {
          expect(app.hasDefinedAndResolvesTo('left')).toBe('__wane__data.left')
        })
        it(`returns itself for "onLeftChange"`, () => {
          expect(app.hasDefinedAndResolvesTo('onLeftChange')).toBe('__wane__data.onLeftChange')
        })
        it(`returns itself for "isRightGreater"`, () => {
          expect(app.hasDefinedAndResolvesTo('isRightGreater')).toBe('__wane__data.isRightGreater')
        })
      })
    })

    describe(`in 05-deep-ifs`, () => {
      const cmps = get05Factories()
      describe(`for ToggleCmp components`, () => {
        describe(`first`, () => {
          it(`returns itself for "value"`, () => {
            expect(cmps.toggleCmp1.hasDefinedAndResolvesTo('value')).toBe('__wane__data.value')
          })
          it(`returns itself for "changeState"`, () => {
            expect(cmps.toggleCmp1.hasDefinedAndResolvesTo('valueChange')).toBe('__wane__data.valueChange')
          })
        })
      })
      describe(`for CounterCmp components`, () => {
        describe(`first`, () => {
          it(`returns itself for "value"`, () => {
            expect(cmps.counterCmp1.hasDefinedAndResolvesTo('value')).toBe('__wane__data.value')
          })
          it(`returns itself for "dec"`, () => {
            expect(cmps.counterCmp1.hasDefinedAndResolvesTo('dec')).toBe('__wane__data.dec')
          })
        })
      })
      describe(`for w:if with condition "visibility.a"`, () => {
        it(`returns null because, even though it's responsible for its dom update, it's not defined here`, () => {
          expect(cmps.ifA.hasDefinedAndResolvesTo('values.a')).toBe(null)
        })
      })
      describe(`for w:if with condition "visibility.b"`, () => {
        it(`returns null because, even though it's responsible for its dom update, it's not defined here`, () => {
          expect(cmps.ifB.hasDefinedAndResolvesTo('values.a')).toBe(null)
        })
      })
      describe(`for w:if with condition "visibility.c"`, () => {
        it(`returns null because, even though it's responsible for its dom update, it's not defined here`, () => {
          expect(cmps.ifC.hasDefinedAndResolvesTo('values.a')).toBe(null)
        })
      })
      describe(`for App component`, () => {
        it(`returns itself for "values.a"`, () => {
          expect(cmps.app.hasDefinedAndResolvesTo('values.a')).toBe('__wane__data.values.a')
        })
        it(`returns itself for "visibility.b"`, () => {
          expect(cmps.app.hasDefinedAndResolvesTo('visibility.b')).toBe('__wane__data.visibility.b')
        })
        it(`returns itself for "onToggle`, () => {
          expect(cmps.app.hasDefinedAndResolvesTo('onToggle')).toBe('__wane__data.onToggle')
        })
      })
    })

  })


  describe(`getSelfBindings`, () => {

    describe(`01-hello-world`, () => {
      describe(`App`, () => {
        const app = apps.helloWorld.getFactoryTree()
        it(`returns an empty iterable because there are no self bindings on the root`, () => {
          expect(Array.from(app.getSelfBindings())).toEqual([])
        })
      })
    })

    describe(`02-counter`, () => {
      const app = apps.counter.getFactoryTree()
      const counter = app.getFirstChild()
      describe(`CounterCmp`, () => {
        const bindings = Array.from(counter.getSelfBindings())
        it(`returns two bindings (input and output)`, () => {
          expect(bindings.length).toBe(2)
          expect(bindings.some(binding => binding instanceof ComponentInputBinding)).toBe(true)
          expect(bindings.some(binding => binding instanceof ComponentOutputBinding)).toBe(true)
        })
      })
      describe(`App`, () => {
        it(`returns an empty iterable because there are no self bindings on the root`, () => {
          expect(Array.from(app.getSelfBindings())).toEqual([])
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const app = apps.toggler.getFactoryTree()
      const [toggleCmp, conditionalView1, conditionalView2] = app.getChildrenFactories()
      describe(`for ToggleCmp`, () => {
        it(`returns two bindings (input and output)`, () => {
          const bindings = Array.from(toggleCmp.getSelfBindings())
          expect(bindings.length).toBe(2)
          expect(bindings.some(binding => binding instanceof ComponentInputBinding)).toBe(true)
          expect(bindings.some(binding => binding instanceof ComponentOutputBinding)).toBe(true)
        })
      })
      describe(`for ConditionalView1`, () => {
        it(`returns a single binding`, () => {
          const bindings = Array.from(conditionalView1.getSelfBindings())
          expect(bindings.length).toBe(1)
          expect(bindings.some(binding => binding instanceof ConditionalViewBinding)).toBe(true)
        })
      })
      describe(`for ConditionalView2`, () => {
        it(`returns a single binding`, () => {
          const bindings = Array.from(conditionalView2.getSelfBindings())
          expect(bindings.length).toBe(1)
          expect(bindings.some(binding => binding instanceof ConditionalViewBinding)).toBe(true)
        })
      })
      describe(`for App`, () => {
        it(`returns an empty iterable because there are no self bindings on the root`, () => {
          expect(Array.from(app.getSelfBindings())).toEqual([])
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const app = apps.comparator.getFactoryTree()
      const [counterCmp1, counterCmp2, infoCmp] = app.getChildrenFactories()
      const [isLeftIsGreater, isRightIsGreater, areEqual] = infoCmp.getChildrenFactories()
      describe(`for CounterCmp1`, () => {
        it(`returns two bindings (input and output)`, () => {
          const bindings = Array.from(counterCmp1.getSelfBindings())
          expect(bindings.length).toBe(2)
          expect(bindings.some(binding => binding instanceof ComponentInputBinding)).toBe(true)
          expect(bindings.some(binding => binding instanceof ComponentOutputBinding)).toBe(true)
        })
      })
      describe(`for CounterCmp2`, () => {
        it(`returns two bindings (input and output)`, () => {
          const bindings = Array.from(counterCmp2.getSelfBindings())
          expect(bindings.length).toBe(2)
          expect(bindings.some(binding => binding instanceof ComponentInputBinding)).toBe(true)
          expect(bindings.some(binding => binding instanceof ComponentOutputBinding)).toBe(true)
        })
      })
      describe(`for IsLeftGreater`, () => {
        it(`returns a single binding`, () => {
          const bindings = Array.from(isLeftIsGreater.getSelfBindings())
          expect(bindings.length).toBe(1)
          expect(bindings.some(binding => binding instanceof ConditionalViewBinding)).toBe(true)
        })
      })
      describe(`for IsRightGreater`, () => {
        it(`returns a single binding`, () => {
          const bindings = Array.from(isRightIsGreater.getSelfBindings())
          expect(bindings.length).toBe(1)
          expect(bindings.some(binding => binding instanceof ConditionalViewBinding)).toBe(true)
        })
      })
      describe(`for AreEqual`, () => {
        it(`returns a single binding`, () => {
          const bindings = Array.from(areEqual.getSelfBindings())
          expect(bindings.length).toBe(1)
          expect(bindings.some(binding => binding instanceof ConditionalViewBinding)).toBe(true)
        })
      })
      describe(`for InfoCmp`, () => {
        it(`returns two bindings (two inputs)`, () => {
          const bindings = Array.from(infoCmp.getSelfBindings())
          expect(bindings.length).toBe(2)
          expect(bindings.every(binding => binding instanceof ComponentInputBinding)).toBe(true)
        })
      })
      describe(`for App`, () => {
        it(`returns an empty iterable because there are no self bindings on the root`, () => {
          expect(Array.from(app.getSelfBindings())).toEqual([])
        })
      })
    })

    describe(`in 05-deep-ifs`, () => {
      const cmps = get05Factories()
      describe(`for ToggleCmp components`, () => {
        it(`they have two bindings: input and output`, () => {
          for (const toggleCmp of cmps.toggleCmps) {
            const bindings = [...toggleCmp.getSelfBindings()]
            expect(bindings.length).toBe(2)
            expect(bindings.some(binding => binding instanceof ComponentInputBinding)).toBe(true)
            expect(bindings.some(binding => binding instanceof ComponentOutputBinding)).toBe(true)
          }
        })
      })
      describe(`for CounterCmp components`, () => {
        it(`they have two bindings: input and output`, () => {
          for (const counterCmp of cmps.counterCmps) {
            const bindings = [...counterCmp.getSelfBindings()]
            expect(bindings.length).toBe(2)
            expect(bindings.some(binding => binding instanceof ComponentInputBinding)).toBe(true)
            expect(bindings.some(binding => binding instanceof ComponentOutputBinding)).toBe(true)
          }
        })
      })
      describe(`for w:if with condition "visibility.a"`, () => {
        it(`has a single binding`, () => {
          const bindings = [...cmps.ifA.getSelfBindings()]
          expect(bindings.length).toBe(1)
          expect(bindings[0] instanceof ConditionalViewBinding).toBe(true)
        })
      })
      describe(`for w:if with condition "visibility.b"`, () => {
        it(`has a single binding`, () => {
          const bindings = [...cmps.ifB.getSelfBindings()]
          expect(bindings.length).toBe(1)
          expect(bindings[0] instanceof ConditionalViewBinding).toBe(true)
        })
      })
      describe(`for w:if with condition "visibility.c"`, () => {
        it(`has a single binding`, () => {
          const bindings = [...cmps.ifC.getSelfBindings()]
          expect(bindings.length).toBe(1)
          expect(bindings[0] instanceof ConditionalViewBinding).toBe(true)
        })
      })
      describe(`for App component`, () => {
        it(`has none because it's the app root`, () => {
          const bindings = [...cmps.app.getSelfBindings()]
          expect(bindings.length).toBe(0)
        })
      })
    })

  })


  describe(`getHtmlNativeDomBindings`, () => {

    describe(`in 01-hello-world`, () => {
      describe(`App`, () => {
        const app = apps.helloWorld.getFactoryTree()
        // const [intro, greeting, comma, someone, exclamation] = app.getHtmlNativeDomBindings()
        it(`returns an iterable of length four: interpol, text, interpol, text`, () => {
          const bindings = Array.from(app.getHtmlNativeDomBindings())
          expect(bindings.length).toBe(4)
          expect(bindings[0] instanceof InterpolationBinding).toBe(true)
          expect(bindings[1] instanceof TextBinding).toBe(true)
          expect(bindings[2] instanceof InterpolationBinding).toBe(true)
          expect(bindings[3] instanceof TextBinding).toBe(true)
        })
      })
    })

    describe(`in 02-counter`, () => {
      const app = apps.counter.getFactoryTree()
      describe(`for CounterCmp`, () => {
        const counterCmp = app.getFirstChild()
        it(`returns an iterable of length five: (click), 'Decrement', {{ value }}, (click), 'Increment'`, () => {
          const bindings = Array.from(counterCmp.getHtmlNativeDomBindings())
          expect(bindings.length).toBe(5)
          expect(bindings[0] instanceof HtmlElementEventBinding).toBe(true, `(click)`)
          expect(bindings[1] instanceof HtmlElementEventBinding).toBe(true, `(click)`)
          expect(bindings[2] instanceof TextBinding).toBe(true, `'Decrement'`)
          expect(bindings[3] instanceof InterpolationBinding).toBe(true, `{{ value }}`)
          expect(bindings[4] instanceof TextBinding).toBe(true, `'Increment'`)
        })
      })
      describe(`for App`, () => {
        it(`returns an iterable of length 0`, () => {
          const bindings = Array.from(app.getHtmlNativeDomBindings())
          expect(bindings.length).toBe(0)
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const app = apps.toggler.getFactoryTree()
      const [toggleCmp, conditionalView1, conditionalView2] = app.getChildrenFactories()
      describe(`for ToggleCmp`, () => {
        it(`returns an iterable of length four: (click), text, interpolation, text`, () => {
          const bindings = Array.from(toggleCmp.getHtmlNativeDomBindings())
          expect(bindings.length).toBe(4)
          expect(bindings[0] instanceof HtmlElementEventBinding).toBe(true, '(click)')
          expect(bindings[1] instanceof TextBinding).toBe(true, 'Toggle (currently ')
          expect(bindings[2] instanceof InterpolationBinding).toBe(true, '{{ value }}')
          expect(bindings[3] instanceof TextBinding).toBe(true, ')')
        })
      })
      describe(`for ConditionalView1`, () => {
        it(`returns an iterable of length 2: [style], "JavaScript!"`, () => {
          const bindings = Array.from(conditionalView1.getHtmlNativeDomBindings())
          expect(bindings.length).toBe(2)
          expect(bindings[0] instanceof HtmlElementPropBinding).toBe(true, `span`)
          expect(bindings[1] instanceof TextBinding).toBe(true, `JavaScript!`)
        })
      })
      describe(`for ConditionalView2`, () => {
        it(`returns an iterable of length 2: span, "TypeScript!"`, () => {
          const bindings = Array.from(conditionalView2.getHtmlNativeDomBindings())
          expect(bindings.length).toBe(2)
          expect(bindings[0] instanceof HtmlElementPropBinding).toBe(true, `span`)
          expect(bindings[1] instanceof TextBinding).toBe(true, `TypeScript!`)
        })
      })
      describe(`for App`, () => {
        it(`returns an iterable of length one: text`, () => {
          const bindings = Array.from(app.getHtmlNativeDomBindings())
          expect(bindings.length).toBe(1)
          expect(bindings.every(isInstance(TextBinding))).toBe(true)
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const app = apps.comparator.getFactoryTree()
      const [counterCmp1, counterCmp2, infoCmp] = app.getChildrenFactories()
      const [isLeftIsGreater, isRightIsGreater, areEqual] = infoCmp.getChildrenFactories()
      describe(`for CounterCmp1 and CounterCmp2`, () => {
        it(`returns an iterable of length 5: (click), (click), "Decrement", {{ value }}, "Increment"`, () => {
          for (const counterCmp of [counterCmp1, counterCmp2]) {
            const bindings = Array.from(counterCmp.getHtmlNativeDomBindings())
            expect(bindings.length).toBe(5)
            expect(bindings[0] instanceof HtmlElementEventBinding).toBe(true, `(click)`)
            expect(bindings[1] instanceof HtmlElementEventBinding).toBe(true, `(click)`)
            expect(bindings[2] instanceof TextBinding).toBe(true, `Decrement`)
            expect(bindings[3] instanceof InterpolationBinding).toBe(true, `{{ value }}`)
            expect(bindings[4] instanceof TextBinding).toBe(true, `Increment`)
          }
        })
      })
      describe(`for IsLeftGreater`, () => {
        it(`returns an iterable of length 2: "left ", {{ isGreaterString }}`, () => {
          const bindings = Array.from(isLeftIsGreater.getHtmlNativeDomBindings())
          expect(bindings.length).toBe(2)
          expect(bindings[0] instanceof TextBinding).toBe(true, `"left "`)
          expect(bindings[1] instanceof InterpolationBinding).toBe(true, `{{ isGreaterString }}`)
        })
      })
      describe(`for IsRightGreater`, () => {
        it(`returns an iterable of length 2: "right ", {{ isGreaterString }}`, () => {
          const bindings = Array.from(isRightIsGreater.getHtmlNativeDomBindings())
          expect(bindings.length).toBe(2)
          expect(bindings[0] instanceof TextBinding).toBe(true, `"right, `)
          expect(bindings[1] instanceof InterpolationBinding).toBe(true, `{{ isGreaterString }}`)
        })
      })
      describe(`for AreEqual`, () => {
        it(`returns an iterable of length 1: "they are equal"`, () => {
          const bindings = Array.from(areEqual.getHtmlNativeDomBindings())
          expect(bindings.length).toBe(1)
          expect(bindings[0] instanceof TextBinding).toBe(true, `"they are equal"`)
        })
      })
      describe(`for InfoCmp`, () => {
        it(`returns an iterable of length 0`, () => {
          const bindings = Array.from(infoCmp.getHtmlNativeDomBindings())
          expect(bindings.length).toBe(0)
        })
      })
      describe(`for App`, () => {
        it(`returns an iterable of length 3: "Left number", "Right number", "Info"`, () => {
          const bindings = Array.from(app.getHtmlNativeDomBindings())
          expect(bindings.length).toBe(3)
          expect(bindings.every(binding => binding instanceof TextBinding)).toBe(true)
        })
      })
    })

    describe(`in 05-deep-ifs`, () => {
      const cmps = get05Factories()
      describe(`for ToggleCmp components`, () => {
        for (const toggleCmp of cmps.toggleCmps) {
          it(`returns an iterable of length of 4: (click), text, interpol, text`, () => {
            const bindings = [...toggleCmp.getHtmlNativeDomBindings()]
            expect(bindings.length).toBe(4)
            expect(bindings.map(binding => binding.constructor)).toEqual([
              HtmlElementEventBinding,
              TextBinding,
              InterpolationBinding,
              TextBinding,
            ])
          })
        }
      })
      describe(`for CounterCmp components`, () => {
        for (const counterCmp of cmps.counterCmps) {
          it(`returns an iterable of length 5: (click), (click), text, interpol, text`, () => {
            const bindings = [...counterCmp.getHtmlNativeDomBindings()]
            expect(bindings.map(binding => binding.constructor)).toEqual([
              HtmlElementEventBinding,
              HtmlElementEventBinding,
              TextBinding,
              InterpolationBinding,
              TextBinding,
            ])
          })
        }
      })
      describe(`for w:if with condition "visibility.a"`, () => {
        it(`returns an iterable of length 2: text, interpol`, () => {
          const bindings = [...cmps.ifA.getHtmlNativeDomBindings()]
          expect(bindings.map(binding => binding.constructor)).toEqual([
            TextBinding,
            InterpolationBinding,
          ])
        })
      })
      describe(`for w:if with condition "visibility.b"`, () => {
        it(`returns an iterable of length 2: text, interpol`, () => {
          const bindings = [...cmps.ifB.getHtmlNativeDomBindings()]
          expect(bindings.map(binding => binding.constructor)).toEqual([
            TextBinding,
            InterpolationBinding,
          ])
        })
      })
      describe(`for w:if with condition "visibility.c"`, () => {
        it(`returns an iterable of length 2: text, interpol`, () => {
          const bindings = [...cmps.ifC.getHtmlNativeDomBindings()]
          expect(bindings.map(binding => binding.constructor)).toEqual([
            TextBinding,
            InterpolationBinding,
          ])
        })
      })
      describe(`for App component`, () => {
        it(`returns a huge iterable`, () => {
          const bindings = [...cmps.app.getHtmlNativeDomBindings()]
          expect(bindings.map(b => b.constructor)).toEqual([
            TextBinding, // "a: "
            TextBinding, // "b: "
            TextBinding, // "c: "
            TextBinding, // "a: "
            TextBinding, // "b: "
            TextBinding, // "c: "
            TextBinding, // "Controls"
            TextBinding, // "Values"
            TextBinding, // "Visibility"
          ])
        })
      })
    })

  })


  describe(`getFactoriesAffectedByCalling`, () => {

    describe(`in 01-hello-world`, () => {
      describe(`for App`, () => {
        const app = apps.helloWorld.getFactoryTree()
        it(`throws when called with whatever because there's not even a method to inspect`, () => {
          expect(() => app.getFactoriesAffectedByCalling(`xxx`)).toThrow()
        })
      })
    })

    describe(`in 02-counter`, () => {
      const app = apps.counter.getFactoryTree()
      const counterCmp = app.getFirstChild()
      describe(`for CounterCmp`, () => {
        it(`returns App for "valueChange" (CounterCmp#valueChange -> App#onCountChange -> App#count)`, () => {
          expect(Array.from(counterCmp.getFactoriesAffectedByCalling(`valueChange`))).toEqual([app])
        })
        it(`returns App for "inc" (CounterCmp#inc -> CounterCmp#valueChange -> App#onCountChange -> App#count)`, () => {
          expect(Array.from(counterCmp.getFactoriesAffectedByCalling(`inc`))).toEqual([app])
        })
        it(`returns App for "dec" (CounterCmp#dec -> CounterCmp#valueChange -> App#onCountChange -> App#count)`, () => {
          expect(Array.from(counterCmp.getFactoriesAffectedByCalling(`dec`))).toEqual([app])
        })
        it(`throws for random stuff`, () => {
          expect(() => counterCmp.getFactoriesAffectedByCalling(`xxx`)).toThrow()
        })
      })
      describe(`for App`, () => {
        it(`throws for random stuff`, () => {
          expect(() => app.getFactoriesAffectedByCalling(`xxx`)).toThrow()
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const app = apps.toggler.getFactoryTree()
      const [toggleCmp, conditionalView1, conditionalView2] = app.getChildrenFactories()
      describe(`for ToggleCmp`, () => {
        it(`returns App for "valueChange" (ToggleCmp#valueChange -> App#onChange -> App#bool)`, () => {
          expect(Array.from(toggleCmp.getFactoriesAffectedByCalling(`valueChange`))).toEqual([app])
        })
        it(`returns App for "changeState" (ToggleCmp#changeState -> ToggleCmp#valueChange -> App#onChange -> App#bool)`, () => {
          expect(Array.from(toggleCmp.getFactoriesAffectedByCalling(`changeState`))).toEqual([app])
        })
      })
      describe(`for ConditionalView1`, () => {
        it(`returns App for "onChange" (ConditionalView1 -> App#onChange -> App#bool)`, () => {
          expect(Array.from(conditionalView1.getFactoriesAffectedByCalling(`onChange`))).toEqual([app])
        })
      })
      describe(`for ConditionalView2`, () => {
        it(`returns App for "onChange" (ConditionalView2 -> App#onChange -> App#bool)`, () => {
          expect(Array.from(conditionalView2.getFactoriesAffectedByCalling(`onChange`))).toEqual([app])
        })
      })
      describe(`for App`, () => {
        it(`returns App for "onChange" (App#onChange -> App#bool)`, () => {
          expect(Array.from(app.getFactoriesAffectedByCalling(`onChange`))).toEqual([app])
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const app = apps.comparator.getFactoryTree()
      const [counterCmp1, counterCmp2, infoCmp] = app.getChildren().values()
      const [isLeftIsGreater, isRightIsGreater, areEqual] = infoCmp.getChildren().values()
      describe(`for CounterCmp1`, () => {
        it(`returns App for "valueChange" (CounterCmp#valueChange -> App#onLeftChange -> App#left)`, () => {
          expect(Array.from(counterCmp1.getFactoriesAffectedByCalling(`valueChange`))).toEqual([app])
        })
        it(`returns App for "inc" (CounterCmp#inc -> CounterCmp#valueChange -> App#onLeftChange -> App#left)`, () => {
          expect(Array.from(counterCmp1.getFactoriesAffectedByCalling(`inc`))).toEqual([app])
        })
        it(`returns App for "dec" (CounterCmp#dec -> CounterCmp#valueChange -> App#onLeftChange -> App#left)`, () => {
          expect(Array.from(counterCmp1.getFactoriesAffectedByCalling(`dec`))).toEqual([app])
        })
      })
      describe(`for CounterCmp2`, () => {
        it(`returns App for "valueChange" (CounterCmp#valueChange -> App#onLeftChange -> App#left)`, () => {
          expect(Array.from(counterCmp2.getFactoriesAffectedByCalling(`valueChange`))).toEqual([app])
        })
        it(`returns App for "inc" (CounterCmp#inc -> CounterCmp#valueChange -> App#onLeftChange -> App#left)`, () => {
          expect(Array.from(counterCmp2.getFactoriesAffectedByCalling(`inc`))).toEqual([app])
        })
        it(`returns App for "dec" (CounterCmp#dec -> CounterCmp#valueChange -> App#onLeftChange -> App#left)`, () => {
          expect(Array.from(counterCmp2.getFactoriesAffectedByCalling(`dec`))).toEqual([app])
        })
      })
      describe(`for IsLeftGreater`, () => {
        it(`throws for "xxx" since there is nothing to call`, () => {
          expect(() => isLeftIsGreater.getFactoriesAffectedByCalling('xxx')).toThrow()
        })
      })
      describe(`for IsRightGreater`, () => {
        it(`throws for "xxx" since there is nothing to call`, () => {
          expect(() => isRightIsGreater.getFactoriesAffectedByCalling('xxx')).toThrow()
        })
      })
      describe(`for AreEqual`, () => {
        it(`throws for "xxx" since there is nothing to call`, () => {
          expect(() => areEqual.getFactoriesAffectedByCalling('xxx')).toThrow()
        })
      })
      describe(`for InfoCmp`, () => {
        it(`throws for "xxx" since there is nothing to call`, () => {
          expect(() => infoCmp.getFactoriesAffectedByCalling('xxx')).toThrow()
        })
      })
      describe(`for App`, () => {
        it(`returns App for "onLeftChange" (App#onLeftChange -> App#left)`, () => {
          expect(Array.from(app.getFactoriesAffectedByCalling('onLeftChange'))).toEqual([app])
        })
        it(`returns App for "onRightChange" (App#onRightChange -> App#right)`, () => {
          expect(Array.from(app.getFactoriesAffectedByCalling('onRightChange'))).toEqual([app])
        })
      })
    })

    describe(`in 05-deep-ifs`, () => {
      const cmps = get05Factories()
      describe(`for ToggleCmp components`, () => {
        for (const toggleCmp of cmps.toggleCmps) {
          it(`returns App for "valueChange" (ToggleCmp#valueChange -> App#onToggle -> App#visibility)`, () => {
            const actual = [...toggleCmp.getFactoriesAffectedByCalling('valueChange')]
            expect(actual).toEqual([cmps.app])
          })
        }
      })
      describe(`for CounterCmp components`, () => {
        for (const counterCmp of cmps.counterCmps) {
          it(`returns App for "dec" (CounterCmp#dec -> CounterCmp#valueChange -> App#onChange -> App#values`, () => {
            const actual = [...counterCmp.getFactoriesAffectedByCalling('dec')]
            expect(actual).toEqual([cmps.app])
          })
        }
      })
      describe(`for w:if with condition "visibility.a"`, () => {
        // nothing to call
      })
      describe(`for w:if with condition "visibility.b"`, () => {
        // nothing to call
      })
      describe(`for w:if with condition "visibility.c"`, () => {
        // nothing to call
      })
      describe(`for App component`, () => {
        it(`returns itself for "onToggle"`, () => {
          const actual = [...cmps.app.getFactoriesAffectedByCalling('onToggle')]
          expect(actual).toEqual([cmps.app])
        })
        it(`returns itself for "onChange"`, () => {
          const actual = [...cmps.app.getFactoriesAffectedByCalling('onChange')]
          expect(actual).toEqual([cmps.app])
        })
      })
    })

  })


  describe(`getFactoryIndexAsChild`, () => {

    describe(`in 01-hello-world`, () => {
      describe(`for App`, () => {
        const app = apps.helloWorld.getFactoryTree()
        it(`throws since it's the root`, () => {
          expect(() => app.getFactoryIndexAsChild()).toThrow()
        })
      })
    })

    describe(`in 02-counter`, () => {
      const app = apps.counter.getFactoryTree()
      const counterCmp = app.getFirstChild()
      describe(`for CounterCmp`, () => {
        it(`returns 0`, () => {
          expect(counterCmp.getFactoryIndexAsChild()).toBe(0)
        })
      })
      describe(`for App`, () => {
        it(`throws since it's the root`, () => {
          expect(() => app.getFactoryIndexAsChild()).toThrow()
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const app = apps.toggler.getFactoryTree()
      const [toggleCmp, conditionalView1, conditionalView2] = app.getChildren().values()
      describe(`for TogglerCmp`, () => {
        it(`returns 0`, () => {
          expect(toggleCmp.getFactoryIndexAsChild()).toBe(0)
        })
      })
      describe(`for ConditionalView1`, () => {
        it(`returns 1`, () => {
          expect(conditionalView1.getFactoryIndexAsChild()).toBe(1)
        })
      })
      describe(`for ConditionalView2`, () => {
        it(`returns 2`, () => {
          expect(conditionalView2.getFactoryIndexAsChild()).toBe(2)
        })
      })
      describe(`for App`, () => {
        it(`throws since it's the root`, () => {
          expect(() => app.getFactoryIndexAsChild()).toThrow()
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const app = apps.comparator.getFactoryTree()
      const [counterCmp1, counterCmp2, infoCmp] = app.getChildren().values()
      const [isLeftIsGreater, isRightIsGreater, areEqual] = infoCmp.getChildren().values()
      describe(`for CounterCmp1`, () => {
        it(`returns 0`, () => {
          expect(counterCmp1.getFactoryIndexAsChild()).toBe(0)
        })
      })
      describe(`for CounterCmp2`, () => {
        it(`returns 1`, () => {
          expect(counterCmp2.getFactoryIndexAsChild()).toBe(1)
        })
      })
      describe(`for IsLeftGreater`, () => {
        it(`returns 0`, () => {
          expect(isLeftIsGreater.getFactoryIndexAsChild()).toBe(0)
        })
      })
      describe(`for IsRightGreater`, () => {
        it(`returns 1`, () => {
          expect(isRightIsGreater.getFactoryIndexAsChild()).toBe(1)
        })
      })
      describe(`for AreEqual`, () => {
        it(`returns 2`, () => {
          expect(areEqual.getFactoryIndexAsChild()).toBe(2)
        })
      })
      describe(`for InfoCmp`, () => {
        it(`returns 2`, () => {
          expect(infoCmp.getFactoryIndexAsChild()).toBe(2)
        })
      })
      describe(`for App`, () => {
        it(`throws since it's root`, () => {
          expect(() => app.getFactoryIndexAsChild()).toThrow()
        })
      })
    })

    describe(`in 05-deep-ifs`, () => {
      const cmps = get05Factories()
      describe(`for ToggleCmp components`, () => {
        describe(`first`, () => {
          it(`returns 3`, () => {
            expect(cmps.toggleCmp1.getFactoryIndexAsChild()).toBe(3)
          })
        })
        describe(`second`, () => {
          it(`returns 4`, () => {
            expect(cmps.toggleCmp2.getFactoryIndexAsChild()).toBe(4)
          })
        })
        describe(`third`, () => {
          it(`returns 5`, () => {
            expect(cmps.toggleCmp3.getFactoryIndexAsChild()).toBe(5)
          })
        })
      })
      describe(`for CounterCmp components`, () => {
        describe(`first`, () => {
          it(`returns 0`, () => {
            expect(cmps.counterCmp1.getFactoryIndexAsChild()).toBe(0)
          })
        })
        describe(`second`, () => {
          it(`returns 1`, () => {
            expect(cmps.counterCmp2.getFactoryIndexAsChild()).toBe(1)
          })
        })
        describe(`third`, () => {
          it(`returns 2`, () => {
            expect(cmps.counterCmp3.getFactoryIndexAsChild()).toBe(2)
          })
        })
      })
      describe(`for w:if with condition "visibility.a"`, () => {
        it(`returns 6`, () => {
          expect(cmps.ifA.getFactoryIndexAsChild()).toBe(6)
        })
      })
      describe(`for w:if with condition "visibility.b"`, () => {
        it(`return 0`, () => {
          expect(cmps.ifB.getFactoryIndexAsChild()).toBe(0)
        })
      })
      describe(`for w:if with condition "visibility.c"`, () => {
        it(`returns 0`, () => {
          expect(cmps.ifC.getFactoryIndexAsChild()).toBe(0)
        })
      })
      describe(`for App component`, () => {
        it(`throws because it's the root`, () => {
          expect(() => cmps.app.getFactoryIndexAsChild()).toThrow()
        })
      })
    })

  })


  describe(`getIndexesFor`, () => {

    describe(`in 01-hello-world`, () => {
      describe(`for App`, () => {
        const app = apps.helloWorld.getFactoryTree()
        const [greeting, comma, someone, exclamation] =
          iterare(app.view.getRoots()).map(tn => tn.getValueOrThrow()).toArray()
        it(`gets index 0 for the greeting`, () => {
          expect(app.getIndexesFor(greeting)).toEqual([0])
        })
        it(`gets index 1 for the comma`, () => {
          expect(app.getIndexesFor(comma)).toEqual([1])
        })
        it(`gets index 2 for the someone`, () => {
          expect(app.getIndexesFor(someone)).toEqual([2])
        })
        it(`gets index 3 for the exclamation`, () => {
          expect(app.getIndexesFor(exclamation)).toEqual([3])
        })
      })
    })

    // TODO
    describe(`in 02-counter`, () => {
      const app = apps.counter.getFactoryTree()
      const counterCmp = app.getFirstChild()
      describe(`for CounterCmp`, () => {
      })
      describe(`for App`, () => {
      })
    })

    // TODO
    // describe(`in 03-toggler`, () => {
    //   const app = apps.toggler.getFactoryTree()
    //   const [toggleCmp, conditionalView1, conditionalView2] = app.getChildren().values()
    //   describe(`for ToggleCmp`, () => {
    //   })
    //   describe(`for ConditionalView1`, () => {
    //   })
    //   describe(`for ConditionalView2`, () => {
    //   })
    //   describe(`for App`, () => {
    //   })
    // })

    // TODO
    // describe(`in 04-comparator`, () => {
    //   const app = apps.comparator.getFactoryTree()
    //   const [counterCmp1, counterCmp2, infoCmp] = app.getChildren().values()
    //   const [isLeftIsGreater, isRightIsGreater, areEqual] = infoCmp.getChildren().values()
    //   describe(`for CounterCmp1`, () => {
    //   })
    //   describe(`for CounterCmp2`, () => {
    //   })
    //   describe(`for IsLeftGreater`, () => {
    //   })
    //   describe(`for IsRightGreater`, () => {
    //   })
    //   describe(`for AreEqual`, () => {
    //   })
    //   describe(`for InfoCmp`, () => {
    //   })
    //   describe(`for App`, () => {
    //   })
    // })

    // TODO
    // describe(`in 05-deep-ifs`, () => {
    //   const cmps = get05Factories()
    //   describe(`for ToggleCmp components`, () => {
    //     for (const toggleCmp of cmps.toggleCmps) {
    //     }
    //   })
    //   describe(`for CounterCmp components`, () => {
    //     for (const counterCmp of cmps.counterCmps) {
    //     }
    //   })
    //   describe(`for w:if with condition "visibility.a"`, () => {
    //   })
    //   describe(`for w:if with condition "visibility.b"`, () => {
    //   })
    //   describe(`for w:if with condition "visibility.c"`, () => {
    //   })
    //   describe(`for App component`, () => {
    //   })
    // })

  })


  describe(`getSingleIndex`, () => {

    describe(`01-hello-world`, () => {
      describe(`App`, () => {
        const app = apps.helloWorld.getFactoryTree()
        const [greeting, comma, someone, exclamation] =
          iterare(app.view.getRoots()).map(tn => tn.getValueOrThrow()).toArray()
        it(`gets index 0 for the greeting`, () => {
          expect(app.getSingleIndexFor(greeting)).toEqual(0)
        })
        it(`gets index 1 for the comma`, () => {
          expect(app.getSingleIndexFor(comma)).toEqual(1)
        })
        it(`gets index 2 for the someone`, () => {
          expect(app.getSingleIndexFor(someone)).toEqual(2)
        })
        it(`gets index 3 for the exclamation`, () => {
          expect(app.getSingleIndexFor(exclamation)).toEqual(3)
        })
      })
    })

    // Enough!

  })


  describe(`printRootDomNodeAssignment`, () => {

    function expectEntryRoot (fa: FactoryAnalyzer<TemplateNodeValue>) {
      expectWriter(
        wr => fa.printRootDomNodeAssignment(wr),
        `this.__wane__root = document.body`,
      )
    }

    function expectComponentRoot (fa: FactoryAnalyzer<TemplateNodeValue>, parentHopCount: number, index: number) {
      expectWriter(
        wr => fa.printRootDomNodeAssignment(wr),
        `this.__wane__root = this${repeat('.__wane__factoryParent', parentHopCount)}.__wane__domNodes[${index}]`,
      )
    }

    function expectDirectiveRoot (fa: FactoryAnalyzer<TemplateNodeValue>, parentHopCount: number, openingIndex: number, closingIndex: number) {
      expectWriter(
        wr => fa.printRootDomNodeAssignment(wr),
        `this.__wane__openingCommentOutlet = this${repeat('.__wane__factoryParent', parentHopCount)}.__wane__domNodes[${openingIndex}]\n` +
        `this.__wane__closingCommentOutlet = this${repeat('.__wane__factoryParent', parentHopCount)}.__wane__domNodes[${closingIndex}]`,
      )
    }

    describe(`in 01-hello-world`, () => {
      const app = apps.helloWorld.getFactoryTree()
      describe(`for App`, () => {
        it(`prints assigning the document.body to the root`, () => {
          expectEntryRoot(app)
        })
      })
    })

    describe(`in 02-counter`, () => {
      const app = apps.counter.getFactoryTree()
      const [counterCmp] = app.getChildren().values()
      describe(`for CounterCmp`, () => {
        it(`prints assigning parent's second root node`, () => {
          expectComponentRoot(counterCmp, 1, 0)
        })
      })
      describe(`for App`, () => {
        it(`prints assigning the document body`, () => {
          expectEntryRoot(app)
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const app = apps.toggler.getFactoryTree()
      const [toggleCmp, conditionalView1, conditionalView2] = app.getChildren().values()
      describe(`for ToggleCmp`, () => {
        it(`prints assigning the first node of parent`, () => {
          expectComponentRoot(toggleCmp, 1, 0)
        })
      })
      describe(`for ConditionalView1`, () => {
        it(`prints assigning the third and fourth parent's node`, () => {
          expectDirectiveRoot(conditionalView1, 1, 2, 3)
        })
      })
      describe(`for ConditionalView2`, () => {
        it(`prints assigning the fifth and sixth parent's node`, () => {
          expectDirectiveRoot(conditionalView2, 1, 4, 5)
        })
      })
      describe(`for App`, () => {
        it(`prints assigning the document body`, () => {
          expectEntryRoot(app)
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const app = apps.comparator.getFactoryTree()
      const [counterCmp1, counterCmp2, infoCmp] = app.getChildren().values()
      const [isLeftIsGreater, isRightIsGreater, areEqual] = infoCmp.getChildren().values()
      describe(`for CounterCmp1`, () => {
        it(`prints assigning the parent node with index 1`, () => {
          expectComponentRoot(counterCmp1, 1, 1)
        })
      })
      describe(`for CounterCmp2`, () => {
        it(`prints assigning the parent node with index 3`, () => {
          expectComponentRoot(counterCmp2, 1, 3)
        })
      })
      describe(`for IsLeftGreater`, () => {
        it(`prints assigning the parent nodes with index 0 and 1`, () => {
          expectDirectiveRoot(isLeftIsGreater, 1, 0, 1)
        })
      })
      describe(`for IsRightGreater`, () => {
        it(`prints assigning the parent nodes with index 2 and 3`, () => {
          expectDirectiveRoot(isRightIsGreater, 1, 2, 3)
        })
      })
      describe(`for AreEqual`, () => {
        it(`prints assigning the parent nodes with index 4 and 5`, () => {
          expectDirectiveRoot(areEqual, 1, 4, 5)
        })
      })
      describe(`for InfoCmp`, () => {
        it(`prints assigning to the parent node with index 5`, () => {
          expectComponentRoot(infoCmp, 1, 5)
        })
      })
      describe(`for App`, () => {
        it(`prints assigning the document body`, () => {
          expectEntryRoot(app)
        })
      })
    })

    describe(`in 05-deep-ifs`, () => {
      const cmps = get05Factories()
      describe(`for ToggleCmp components`, () => {
        describe(`first`, () => {
          it(`prints assigning to parent node with index 13`, () => {
            expectComponentRoot(cmps.toggleCmp1, 1, 13)
          })
        })
        describe(`second`, () => {
          it(`prints assigning to parent node with index 15`, () => {
            expectComponentRoot(cmps.toggleCmp2, 1, 15)
          })
        })
        describe(`third`, () => {
          it(`prints assigning to parent node with index 17`, () => {
            expectComponentRoot(cmps.toggleCmp3, 1, 17)
          })
        })
      })
      describe(`for CounterCmp components`, () => {
        describe(`first`, () => {
          it(`prints assigning to parent node with index 6`, () => {
            expectComponentRoot(cmps.counterCmp1, 1, 6)
          })
        })
        describe(`second`, () => {
          it(`prints assigning to parent node with index 8`, () => {
            expectComponentRoot(cmps.counterCmp2, 1, 8)
          })
        })
        describe(`third`, () => {
          it(`prints assigning to parent node with index 10`, () => {
            expectComponentRoot(cmps.counterCmp3, 1, 10)
          })
        })
      })
      describe(`for w:if with condition "visibility.a"`, () => {
        it(`prints assigning to parent with indexes 1 and 2`, () => {
          expectDirectiveRoot(cmps.ifA, 1, 1, 2)
        })
      })
      describe(`for w:if with condition "visibility.b"`, () => {
        it(`prints assigning to parent with indexes 2 and 3`, () => {
          expectDirectiveRoot(cmps.ifB, 1, 2, 3)
        })
      })
      describe(`for w:if with condition "visibility.c"`, () => {
        it(`prints assigning to aprent with indexes 2 and 3`, () => {
          expectDirectiveRoot(cmps.ifC, 1, 2, 3)
        })
      })
      describe(`for App component`, () => {
        it(`prints assigning the document body`, () => {
          expectEntryRoot(cmps.app)
        })
      })
    })

  })


  describe(`factoryAnalyzersInScope`, () => {

    describe(`in 01-hello-world`, () => {
      const fas = get01Factories()
      describe(`for App`, () => {
        it(`returns an empty iterable when skipSelf is true`, () => {
          expect(Array.from(fas.app.factoryAnalyzersInScope({skipSelf: true}))).toEqual([])
        })
        it(`returns an iterable with itself when skipSelf is false`, () => {
          expect(Array.from(fas.app.factoryAnalyzersInScope({skipSelf: false}))).toEqual([fas.app])
        })
      })
    })

    describe(`in 02-counter`, () => {
      const fas = get02Factories()
      describe(`for CounterCmp`, () => {
        it(`returns an empty iterable when skipSelf is true`, () => {
          expect(Array.from(fas.counterCmp.factoryAnalyzersInScope({skipSelf: true}))).toEqual([])
        })
        it(`returns an iterable with itself when skipSelf is false`, () => {
          expect(Array.from(fas.counterCmp.factoryAnalyzersInScope({skipSelf: false}))).toEqual([fas.counterCmp])
        })
      })
      describe(`for App`, () => {
        it(`returns an iterable with CounterCmp when skipSelf is true`, () => {
          expect(Array.from(fas.app.factoryAnalyzersInScope({skipSelf: true}))).toEqual([fas.counterCmp])
        })
        it(`returns an iterable with CounterCmp and itself when skipSelf is false`, () => {
          expect(Array.from(fas.app.factoryAnalyzersInScope({skipSelf: false}))).toEqual([fas.app, fas.counterCmp])
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const fas = get03Factories()
      describe(`for ToggleCmp`, () => {
        it(`returns an empty iterable when skipSelf is true`, () => {
          expect(Array.from(fas.toggleCmp.factoryAnalyzersInScope({skipSelf: true}))).toEqual([])
        })
        it(`returns an iterable with itself when skipSelf is false`, () => {
          expect(Array.from(fas.toggleCmp.factoryAnalyzersInScope({skipSelf: false}))).toEqual([fas.toggleCmp])
        })
      })
      describe(`for ConditionalView1`, () => {
        it(`returns iterable with the partial view when skipSelf is true`, () => {
          expect(Array.from(fas.isJavaScriptCondDir.factoryAnalyzersInScope({skipSelf: true})))
            .toEqual([fas.isJavaScriptPartial])
        })
        it(`returns an iterable with itself and the partial view when skipSelf is false`, () => {
          expect(Array.from(fas.isJavaScriptCondDir.factoryAnalyzersInScope({skipSelf: false}))).toEqual([
            fas.isJavaScriptCondDir,
            fas.isJavaScriptPartial,
          ])
        })
      })
      describe(`for ConditionalView1 Partial`, () => {
        it(`returns an empty iterable when skipSelf is true`, () => {
          expect(Array.from(fas.isJavaScriptPartial.factoryAnalyzersInScope({skipSelf: true}))).toEqual([])
        })
        it(`returns an iterable with itself when skipSelf is false`, () => {
          expect(Array.from(fas.isJavaScriptPartial.factoryAnalyzersInScope({skipSelf: false})))
            .toEqual([fas.isJavaScriptPartial])
        })
      })
      describe(`for ConditionalView2`, () => {
        it(`returns an empty iterable when skipSelf is true`, () => {
          expect(Array.from(fas.isTypeScriptCondDir.factoryAnalyzersInScope({skipSelf: true})))
            .toEqual([fas.isTypeScriptPartial])
        })
        it(`returns an iterable with itself when skipSelf is false`, () => {
          expect(Array.from(fas.isTypeScriptCondDir.factoryAnalyzersInScope({skipSelf: false}))).toEqual([
            fas.isTypeScriptCondDir,
            fas.isTypeScriptPartial,
          ])
        })
      })
      describe(`for ConditionalView2 Partial`, () => {
        it(`returns an empty iterable when skipSelf is true`, () => {
          expect(Array.from(fas.isTypeScriptPartial.factoryAnalyzersInScope({skipSelf: true}))).toEqual([])
        })
        it(`returns an iterable with itself when skipSelf is false`, () => {
          expect(Array.from(fas.isTypeScriptPartial.factoryAnalyzersInScope({skipSelf: false})))
            .toEqual([fas.isTypeScriptPartial])
        })
      })
      describe(`for App`, () => {
        it(`returns an iterable with ToggleCmp, IsJavaScript, IsJavaScriptPartial, IsTypeScript and IsTypeScriptPartial when skipSelf is true`, () => {
          expect(new Set(fas.app.factoryAnalyzersInScope({skipSelf: true})))
            .toEqual(new Set([
              fas.toggleCmp,
              fas.isJavaScriptCondDir,
              fas.isJavaScriptPartial,
              fas.isTypeScriptCondDir,
              fas.isTypeScriptPartial,
            ]))
        })
        it(`returns an iterable with ToggleCmp, IsJavaScript, IsTypeScript and itself when skipSelf is false`, () => {
          expect(new Set(fas.app.factoryAnalyzersInScope({skipSelf: false})))
            .toEqual(new Set([
              fas.app,
              fas.toggleCmp,
              fas.isJavaScriptCondDir,
              fas.isJavaScriptPartial,
              fas.isTypeScriptCondDir,
              fas.isTypeScriptPartial,
            ]))
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const fas = get04Factories()
      describe(`for CounterCmp1`, () => {
        it(`returns an empty iterable when skipSelf is true`, () => {
          expect(Array.from(fas.counterCmp1.factoryAnalyzersInScope({skipSelf: true})))
            .toEqual([])
        })
        it(`returns an iterable with itself when skipSelf is false`, () => {
          expect(Array.from(fas.counterCmp1.factoryAnalyzersInScope({skipSelf: false})))
            .toEqual([fas.counterCmp1])
        })
      })
      describe(`for CounterCmp2`, () => {
        it(`returns an empty iterable when skipSelf is true`, () => {
          expect(Array.from(fas.counterCmp2.factoryAnalyzersInScope({skipSelf: true})))
            .toEqual([])
        })
        it(`returns an iterable with itself when skipSelf is false`, () => {
          expect(Array.from(fas.counterCmp2.factoryAnalyzersInScope({skipSelf: false})))
            .toEqual([fas.counterCmp2])
        })
      })
      describe(`for IsLeftGreaterCondDir`, () => {
        it(`returns an iterable with the partial view when skipSelf is true`, () => {
          expect(Array.from(fas.isLeftGreaterCondDir.factoryAnalyzersInScope({skipSelf: true})))
            .toEqual([fas.isLeftGreaterPartial])
        })
        it(`returns an iterable with itself and the partial when skipSelf is false`, () => {
          expect(Array.from(fas.isLeftGreaterCondDir.factoryAnalyzersInScope({skipSelf: false})))
            .toEqual([fas.isLeftGreaterCondDir, fas.isLeftGreaterPartial])
        })
      })
      describe(`for IsLeftGreaterPartial`, () => {
        it(`returns an empty iterable when skipSelf is true`, () => {
          expect(Array.from(fas.isLeftGreaterPartial.factoryAnalyzersInScope({skipSelf: true})))
            .toEqual([])
        })
        it(`returns an iterable with itself when skipSelf is false`, () => {
          expect(Array.from(fas.isLeftGreaterPartial.factoryAnalyzersInScope({skipSelf: false})))
            .toEqual([fas.isLeftGreaterPartial])
        })
      })
      describe(`for IsRightGreater`, () => {
        it(`returns an iterable with the partial when skipSelf is true`, () => {
          expect(Array.from(fas.isRightGreaterCondDir.factoryAnalyzersInScope({skipSelf: true})))
            .toEqual([fas.isRightGreaterPartial])
        })
        it(`returns an iterable with itself and the partial when skipSelf is false`, () => {
          expect(Array.from(fas.isRightGreaterCondDir.factoryAnalyzersInScope({skipSelf: false})))
            .toEqual([fas.isRightGreaterCondDir, fas.isRightGreaterPartial])
        })
      })
      describe(`for IsRightGreater`, () => {
        it(`returns an empty iterable when skipSelf is true`, () => {
          expect(Array.from(fas.isRightGreaterPartial.factoryAnalyzersInScope({skipSelf: true})))
            .toEqual([])
        })
        it(`returns an iterable with itself when skipSelf is false`, () => {
          expect(Array.from(fas.isRightGreaterPartial.factoryAnalyzersInScope({skipSelf: false})))
            .toEqual([fas.isRightGreaterPartial])
        })
      })
      describe(`for AreEqual`, () => {
        it(`returns an iterable with the partial view when skipSelf is true`, () => {
          expect(Array.from(fas.areEqualCondDir.factoryAnalyzersInScope({skipSelf: true})))
            .toEqual([fas.areEqualPartial])
        })
        it(`returns an iterable with itself and the partial view when skipSelf is false`, () => {
          expect(Array.from(fas.areEqualCondDir.factoryAnalyzersInScope({skipSelf: false})))
            .toEqual([fas.areEqualCondDir, fas.areEqualPartial])
        })
      })
      describe(`for AreEqualPartial`, () => {
        it(`returns an empty iterable when skipSelf is true`, () => {
          expect(Array.from(fas.areEqualPartial.factoryAnalyzersInScope({skipSelf: true})))
            .toEqual([])
        })
        it(`returns an iterable with itself when skipSelf is false`, () => {
          expect(Array.from(fas.areEqualPartial.factoryAnalyzersInScope({skipSelf: false})))
            .toEqual([fas.areEqualPartial])
        })
      })
      describe(`for InfoCmp`, () => {
        const skipSelfTrue = [
          fas.isLeftGreaterCondDir,
          fas.isLeftGreaterPartial,
          fas.isRightGreaterCondDir,
          fas.isRightGreaterPartial,
          fas.areEqualCondDir,
          fas.areEqualPartial,
        ]
        it(`returns an iterable with IsLeftGreater, IsRightGreater and AreEqual when skipSelf is true`, () => {
          expect(new Set(fas.infoCmp.factoryAnalyzersInScope({skipSelf: true})))
            .toEqual(new Set([...skipSelfTrue]))
        })
        it(`returns an iterable with itself, IsLeftGreater, IsRightGreater and AreEqual when skipSelf is false`, () => {
          expect(new Set(fas.infoCmp.factoryAnalyzersInScope({skipSelf: false})))
            .toEqual(new Set([fas.infoCmp, ...skipSelfTrue]))
        })
      })
      describe(`for App`, () => {

        it(`returns an iterable with CounterCmp, CounterCmp and InfoCmp when skipSelf is true`, () => {
          expect(Array.from(fas.app.factoryAnalyzersInScope({skipSelf: true}))).toEqual([
            fas.counterCmp1,
            fas.counterCmp2,
            fas.infoCmp,
          ])
        })
        it(`returns an iterable with itself, CounterCmp, CounterCmp and InfoCmp when skipSelf is false`, () => {
          expect(Array.from(fas.app.factoryAnalyzersInScope({skipSelf: false})))
            .toEqual([fas.app, fas.counterCmp1, fas.counterCmp2, fas.infoCmp])
        })
      })
    })

    describe(`in 05-deep-ifs`, () => {
      const fas = get05Factories()
      describe(`for ToggleCmp components`, () => {
        for (const toggleCmp of fas.toggleCmps) {
          it(`is an empty iterable`, () => [
            expect([...toggleCmp.factoryAnalyzersInScope({skipSelf: true})].length).toBe(0),
          ])
        }
      })
      describe(`for CounterCmp components`, () => {
        for (const counterCmp of fas.counterCmps) {
          it(`is an empty iterable`, () => [
            expect([...counterCmp.factoryAnalyzersInScope({skipSelf: true})].length).toBe(0),
          ])
        }
      })
      describe(`for w:if with condition "visibility.a"`, () => {
        it(`is {ifA, isAPartial, ifB, ifBPartial, ifC, ifCPartial} including self`, () => {
          const actual = new Set(fas.ifA.factoryAnalyzersInScope())
          expect(actual).toEqual(new Set([
            fas.ifA, fas.ifB, fas.ifC,
            fas.ifAPartial, fas.ifBPartial, fas.ifCPartial,
          ]))
        })
      })
      describe(`for partial view of w:if with condition "visibility.a"`, () => {
        it(`is {ifAPartial, ifB, ifBPartial, ifC, ifCPartial}`, () => {
          const actual = new Set(fas.ifAPartial.factoryAnalyzersInScope())
          expect(actual).toEqual(new Set([
            fas.ifB, fas.ifC,
            fas.ifAPartial, fas.ifBPartial, fas.ifCPartial,
          ]))
        })
      })
      describe(`for w:if with condition "visibility.b"`, () => {
        it(`is {ifBPartial, ifC, ifCPartial} exclude self`, () => {
          const actual = new Set(fas.ifB.factoryAnalyzersInScope({skipSelf: true}))
          expect(actual).toEqual(new Set([
            fas.ifBPartial,
            fas.ifC,
            fas.ifCPartial,
          ]))
        })
      })
      describe(`for w:if with condition "visibility.c"`, () => {
        it(`is {ifC, ifCPartial} excluding self`, () => {
          const actual = new Set(fas.ifC.factoryAnalyzersInScope({skipSelf: true}))
          expect(actual).toEqual(new Set([
            fas.ifCPartial,
          ]))
        })
      })
      describe(`for App component`, () => {
        it(`is {App, CounterCmp1, 2, 3, ToggleCmp, 1, 2, 3, ifA, ifAPartial, ifB, ifBPartial, ifC, ifCPartial} including self`, () => {
          const actual = new Set(fas.app.factoryAnalyzersInScope())
          expect(actual).toEqual(new Set([
            fas.app,
            ...fas.counterCmps, ...fas.toggleCmps,
            fas.ifA, fas.ifB, fas.ifC,
            fas.ifAPartial, fas.ifBPartial, fas.ifCPartial,
          ]))
        })
      })
    })

  })


  describe(`domNodesInScope`, () => {

    describe(`01-hello-world`, () => {
      describe(`App`, () => {
        const app = apps.helloWorld.getFactoryTree()
        it(`returns all dom nodes`, () => {
          const allDomNodes = Array.from(iterare(app.view).map(n => n.getValueOrThrow()))
          const domNodesInScope = Array.from(app.domNodesInScope())
          expect(allDomNodes).toEqual(domNodesInScope)
        })
      })
    })

    // This is too difficult to test like this.

  })


  describe(`getDomDiffMap`, () => {

    describe(`in 01-hello-world`, () => {
      const app = apps.helloWorld.getFactoryTree()
      describe(`App`, () => {
        const [greeting, , someone] = app.view
        const domDiffMap = app.getDomDiffMap()
        it(`has two entries`, () => {
          expect(Array.from(domDiffMap).length).toBe(2)
        })
        it(`maps #0 ({{ greeting }}) to a set ["greeting"]`, () => {
          const zero = Array.from(domDiffMap.get(0)!) as ViewBoundValue[]
          const greetingBoundValues = iterare(greeting.getValueOrThrow().viewBindings)
            .map(vb => vb.boundValue)
            .toArray() as ViewBoundValue[]
          expect(zero).toEqual(greetingBoundValues)
        })
        it(`maps #2 ({{ someone }}) to a set ["someone"]`, () => {
          const two = Array.from(domDiffMap.get(2)!) as ViewBoundValue[]
          const someoneBoundValues = iterare(someone.getValueOrThrow().viewBindings)
            .map(vb => vb.boundValue)
            .toArray() as ViewBoundValue[]
          expect(two).toEqual(someoneBoundValues)
        })
      })
    })

    describe(`in 02-counter`, () => {
      const app = apps.counter.getFactoryTree()
      const counterCmp = app.getFirstChild()
      describe(`for CounterCmp`, () => {
        const domDiffMap = counterCmp.getDomDiffMap()
        it(`has a single entry`, () => {
          expect(Array.from(domDiffMap).length).toBe(1)
        })
        it(`maps 4 to {{ value }}`, () => {
          const eight = Array.from(domDiffMap.get(4)!) as ViewBoundValue[]
          const node = counterCmp.view.getByChildPath(1, 0)!
          const boundValues = iterare(node.getValueOrThrow().viewBindings)
            .map(vb => vb.boundValue)
            .toArray() as ViewBoundValue[]
          expect(eight).toEqual(boundValues)
        })
      })
      describe(`for App`, () => {
        const domDiffMap = app.getDomDiffMap()
        it(`has no entries`, () => {
          expect(Array.from(domDiffMap).length).toBe(0)
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const app = apps.toggler.getFactoryTree()
      const [toggleCmp, conditionalView1, conditionalView2] = app.getChildren().values()
      describe(`for ToggleCmp`, () => {
        const domDiffMap = toggleCmp.getDomDiffMap()
        it(`has a single entry`, () => {
          expect(Array.from(domDiffMap).length).toBe(1)
        })
        it(`maps 2 to {{ value }}`, () => {
          const four = Array.from(domDiffMap.get(2)!) as ViewBoundValue[]
          const node = toggleCmp.view.getByChildPath(0, 1)
          const boundValues = iterare(node.getValueOrThrow().viewBindings)
            .map(vb => vb.boundValue)
            .toArray() as ViewBoundValue[]
          expect(four).toEqual(boundValues)
        })
      })
      describe(`for ConditionalView1`, () => {
        const domDiffMap = conditionalView1.getDomDiffMap()
        it(`has no entries`, () => {
          expect(Array.from(domDiffMap).length).toBe(0)
        })
      })
      describe(`for ConditionalView2`, () => {
        const domDiffMap = conditionalView2.getDomDiffMap()
        it(`has no entries`, () => {
          expect(Array.from(domDiffMap).length).toBe(0)
        })
      })
      describe(`for App`, () => {
        const domDiffMap = app.getDomDiffMap()
        it(`has no entries`, () => {
          expect(Array.from(domDiffMap).length).toBe(0)
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const app = apps.comparator.getFactoryTree()
      const [counterCmp1, counterCmp2, infoCmp] = app.getChildren().values()
      const [isLeftIsGreater, isRightIsGreater, areEqual] = infoCmp.getChildren().values()
      describe(`for CounterCmp1`, () => {
        const domDiffMap = counterCmp1.getDomDiffMap()
        it(`has one entry`, () => {
          expect(Array.from(domDiffMap).length).toBe(1)
        })
        it(`maps 4 to {{ value }}`, () => {
          const actual = Array.from(domDiffMap.get(4)!) as ViewBoundValue[]
          const templateNode = counterCmp1.view.getByChildPath(1, 0)
          const expected = iterare(templateNode.getValueOrThrow().viewBindings)
            .map(vb => vb.boundValue)
            .toArray() as ViewBoundValue[]
          expect(actual).toEqual(expected)
        })
      })
      describe(`for CounterCmp2`, () => {
        const domDiffMap = counterCmp2.getDomDiffMap()
        it(`has one entry`, () => {
          expect(Array.from(domDiffMap).length).toBe(1)
        })
        it(`maps 4 to {{ value }}`, () => {
          const actual = Array.from(domDiffMap.get(4)!) as ViewBoundValue[]
          const templateNode = counterCmp2.view.getByChildPath(1, 0)
          const expected = iterare(templateNode.getValueOrThrow().viewBindings)
            .map(vb => vb.boundValue)
            .toArray() as ViewBoundValue[]
          expect(actual).toEqual(expected)
        })
      })
      describe(`for IsLeftGreater`, () => {
        const domDiffMap = isLeftIsGreater.getDomDiffMap()
        it(`has no entries`, () => {
          expect(Array.from(domDiffMap).length).toBe(0)
        })
      })
      describe(`for IsRightGreater`, () => {
        const domDiffMap = isRightIsGreater.getDomDiffMap()
        it(`has no entries`, () => {
          expect(Array.from(domDiffMap).length).toBe(0)
        })
      })
      describe(`for AreEqual`, () => {
        const domDiffMap = areEqual.getDomDiffMap()
        it(`has no entries`, () => {
          expect(Array.from(domDiffMap).length).toBe(0)
        })
      })
      describe(`for InfoCmp`, () => {
        const domDiffMap = infoCmp.getDomDiffMap()
        it(`has no entries`, () => {
          expect(Array.from(domDiffMap).length).toBe(0)
        })
      })
      describe(`for App`, () => {
        const domDiffMap = app.getDomDiffMap()
        it(`has no entries`, () => {
          expect(Array.from(domDiffMap).length).toBe(0)
        })
      })
    })

  })


  describe(`getFaDiffMap`, () => {

    describe(`in 01-hello-world`, () => {
      const app = apps.helloWorld.getFactoryTree()
      describe(`for App`, () => {
        it(`returns empty factory diff map because it has no children`, () => {
          expect(Array.from(app.getFaDiffMap()).length).toBe(0)
        })
      })
    })

    describe(`in 02-counter`, () => {
      const app = apps.counter.getFactoryTree()
      const counterCmp = app.getFirstChild()
      describe(`for CounterCmp`, () => {
        it(`returns empty factory diff map because it has no children`, () => {
          expect(Array.from(counterCmp.getFaDiffMap()).length).toBe(0)
        })
      })
      describe(`for App`, () => {
        const map = app.getFaDiffMap()
        it(`has a single entry`, () => {
          expect(map.size).toEqual(1)
        })
        it(`maps CounterCmp into a set which contains the "count" prop access bound to "value" input`, () => {
          const set = map.get(counterCmp)!
          expect(set).not.toBeFalsy()
          const counterCmpNodeValue = app.view
            .findOrFail(isCmpNodeWithName('Counter'))
            .getValueOrThrow()
          const inputBinding = counterCmpNodeValue.getInputBindingByNameOrFail('value')
          expect(set.has(inputBinding.boundValue as ViewBoundPropertyAccess)).toBe(true)
        })
      })
    })

    describe(`03-toggler`, () => {
      const app = apps.toggler.getFactoryTree()
      const [toggleCmp, conditionalView1, conditionalView2] = app.getChildren().values()
      describe(`for ToggleCmp`, () => {
        it(`returns empty factory diff map because it has no children`, () => {
          expect(Array.from(toggleCmp.getFaDiffMap()).length).toBe(0)
        })
      })
      describe(`for ConditionalView1`, () => {
        it(`returns empty factory diff map because it has no children`, () => {
          expect(Array.from(conditionalView1.getFaDiffMap()).length).toBe(0)
        })
      })
      describe(`for ConditionalView2`, () => {
        it(`returns empty factory diff map because it has no children`, () => {
          expect(Array.from(conditionalView2.getFaDiffMap()).length).toBe(0)
        })
      })
      describe(`for App`, () => {
        it(`has length three`, () => {
          const map = app.getFaDiffMap()
          expect(map.size).toBe(3)
        })
        describe(`set which maps from toggle-cmp`, () => {
          const map = app.getFaDiffMap()
          const set = map.get(toggleCmp)!
          it(`exists`, () => expect(set).not.toBeFalsy())
          it(`has size 1`, () => expect(set.size).toBe(1))
          it(`contains the "bool" binding to "value" input`, () => {
            const toggleCmpNodeValue = app.view
              .findOrFail(isCmpNodeWithName('Toggle'))
              .getValueOrThrow()
            const inputBinding = toggleCmpNodeValue.getInputBindingByNameOrFail('value')
            const inputBindingBoundValue = inputBinding.boundValue as ViewBoundPropertyAccess
            const [setItem] = set
            expect(setItem).toBe(inputBindingBoundValue)
          })
        })
        describe(`set which maps from w:if isJavaScript`, () => {
          const map = app.getFaDiffMap()
          const set = map.get(conditionalView1)!
          it(`exists`, () => expect(set).not.toBeFalsy())
          it(`has size 1`, () => expect(set.size).toBe(1))
          it(`contains the "isJavaScript" binding to the conditional node`, () => {
            const isJsNodeValue = app.view
              .findOrFail(isConditionalViewNodeWithVar('isJavaScript'))
              .getValueOrThrow()
            const [binding] = isJsNodeValue.viewBindings
            const boundValue = binding.boundValue as ViewBoundPropertyAccess
            const [setItem] = set
            expect(setItem).toBe(boundValue)
          })
        })
        describe(`set which maps from w:for isTypeScript`, () => {
          const map = app.getFaDiffMap()
          const set = map.get(conditionalView2)!
          it(`exists`, () => expect(set).not.toBeFalsy())
          it(`has size 1`, () => expect(set.size).toBe(1))
          it(`contains the "isTypeScript" binding to the conditional node`, () => {
            const isTsNodeValue = app.view
              .findOrFail(isConditionalViewNodeWithVar('isTypeScript'))
              .getValueOrThrow()
            const [binding] = isTsNodeValue.viewBindings
            const boundValue = binding.boundValue as ViewBoundPropertyAccess
            const [setItem] = set
            expect(setItem).toBe(boundValue)
          })
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const fas = get04Factories()
      describe(`for CounterCmp1`, () => {
        it(`returns empty factory diff map because it has no children`, () => {
          expect(Array.from(fas.counterCmp1.getFaDiffMap()).length).toBe(0)
        })
      })
      describe(`for CounterCmp2`, () => {
        it(`returns empty factory diff map because it has no children`, () => {
          expect(Array.from(fas.counterCmp2.getFaDiffMap()).length).toBe(0)
        })
      })
      describe(`for IsLeftGreater (directive)`, () => {
        it(`returns a map with one entry`, () => {
          const diff = fas.isLeftGreaterCondDir.getFaDiffMap()
          expect(diff.size).toBe(1)
        })
        describe(`set mapped from the partial view`, () => {
          const diff = fas.isLeftGreaterCondDir.getFaDiffMap()
          const set = diff.get(fas.isLeftGreaterPartial)!
          it(`has size 1`, () => expect(set.size).toBe(1))
          it(`contains the "isGreaterString" binding`, () => {
            const [binding] = fas.isLeftGreaterPartial.view
              .getByChildPath(1)
              .getValueOrThrow()
              .viewBindings
            const boundValue = binding.boundValue as ViewBoundPropertyAccess
            expect(set.has(boundValue)).toBe(true)
          })
        })
      })
      describe(`for IsLeftGreater (partial view)`, () => {
        it(`returns an empty map because there are no children`, () => {
          expect(fas.isLeftGreaterPartial.getFaDiffMap().size).toBe(0)
        })
      })
      describe(`for IsRightGreater (directive)`, () => {
        it(`returns a map with one entry`, () => {
          const diff = fas.isRightGreaterCondDir.getFaDiffMap()
          expect(diff.size).toBe(1)
        })
        describe(`set mapped from the partial view`, () => {
          const diff = fas.isRightGreaterCondDir.getFaDiffMap()
          const set = diff.get(fas.isRightGreaterPartial)!
          it(`has size 1`, () => expect(set.size).toBe(1))
          it(`contains the "isGreaterString" binding`, () => {
            const [binding] = fas.isRightGreaterPartial.view
              .getByChildPath(1)
              .getValueOrThrow()
              .viewBindings
            const boundValue = binding.boundValue as ViewBoundPropertyAccess
            expect(set.has(boundValue)).toBe(true)
          })
        })
      })
      describe(`for IsRightGreater (partial view)`, () => {
        it(`returns an empty map because there are no children`, () => {
          expect(fas.isLeftGreaterPartial.getFaDiffMap().size).toBe(0)
        })
      })
      describe(`for AreEqual (directive)`, () => {
        it(`returns an empty map because there's nothing`, () => {
          expect(fas.areEqualCondDir.getFaDiffMap().size).toBe(0)
        })
      })
      describe(`for AreEqual (partial)`, () => {
        it(`returns empty factory diff map because it has no children`, () => {
          expect(fas.areEqualPartial.getFaDiffMap().size).toBe(0)
        })
      })
      describe(`for InfoCmp`, () => {
        const map = fas.infoCmp.getFaDiffMap()
        it(`has size 5`, () => expect(map.size).toEqual(5))
        describe(`set which maps from the first w:if (directive)`, () => {
          const set = map.get(fas.isLeftGreaterCondDir)!
          it(`exists`, () => expect(set).not.toBeFalsy())
          it(`has size 2`, () => expect(set.size).toBe(2))
          it(`contains the "isLeftGreater" binding`, () => {
            const isLeftGreaterNodeValue = fas.infoCmp.view
              .findOrFail(isConditionalViewNodeWithVar('isLeftGreater'))
              .getValueOrThrow()
            const [binding] = isLeftGreaterNodeValue.viewBindings
            const boundValue = binding.boundValue as ViewBoundPropertyAccess
            expect(set.has(boundValue)).toBe(true)
          })
          it(`contains the "isGreaterString" binding`, () => {
            const isGreaterStringInterpolationNodeValue = fas.isLeftGreaterCondDir.view
              .getByChildPath(1)
              .getValueOrThrow()
            const [binding] = isGreaterStringInterpolationNodeValue.viewBindings
            const boundValue = binding.boundValue as ViewBoundPropertyAccess
            expect(set.has(boundValue)).toBe(true)
          })
        })
        describe(`set which maps from the first w:if (partial view)`, () => {
          const set = map.get(fas.isLeftGreaterPartial)!
          it(`exists`, () => expect(set).not.toBeFalsy())
          it(`has size 1`, () => expect(set.size).toBe(1))
          it(`contains the "isGreaterString" binding`, () => {
            const isGreaterStringInterpolationNodeValue = fas.isLeftGreaterCondDir.view
              .getByChildPath(1)
              .getValueOrThrow()
            const [binding] = isGreaterStringInterpolationNodeValue.viewBindings
            const boundValue = binding.boundValue as ViewBoundPropertyAccess
            expect(set.has(boundValue)).toBe(true)
          })
        })
        describe(`set which maps from the second w:if (directive view)`, () => {
          const set = map.get(fas.isRightGreaterCondDir)!
          it(`exists`, () => expect(set).not.toBeFalsy())
          it(`has size 2`, () => expect(set.size).toBe(2))
          it(`contains the "isRightGreater" binding`, () => {
            const isRightGreaterNodeValue = fas.infoCmp.view
              .findOrFail(isConditionalViewNodeWithVar('isRightGreater'))
              .getValueOrThrow()
            const [binding] = isRightGreaterNodeValue.viewBindings
            const boundValue = binding.boundValue as ViewBoundPropertyAccess
            expect(set.has(boundValue)).toBe(true)
          })
          it(`contains the "isGreaterString" binding`, () => {
            const isGreaterStringInterpolationNodeValue = fas.isRightGreaterCondDir.view
              .getByChildPath(1)
              .getValueOrThrow()
            const [binding] = isGreaterStringInterpolationNodeValue.viewBindings
            const boundValue = binding.boundValue as ViewBoundPropertyAccess
            expect(set.has(boundValue)).toBe(true)
          })
        })
        describe(`set which maps from the second w:if (partial view)`, () => {
          const set = map.get(fas.isRightGreaterPartial)!
          it(`exists`, () => expect(set).not.toBeFalsy())
          it(`has size 1`, () => expect(set.size).toBe(1))
          it(`contains the "isGreaterString" binding`, () => {
            const isGreaterStringInterpolationNodeValue = fas.isRightGreaterCondDir.view
              .getByChildPath(1)
              .getValueOrThrow()
            const [binding] = isGreaterStringInterpolationNodeValue.viewBindings
            const boundValue = binding.boundValue as ViewBoundPropertyAccess
            expect(set.has(boundValue)).toBe(true)
          })
        })
        describe(`set which maps from the third w:if (directive)`, () => {
          const set = map.get(fas.areEqualCondDir)!
          it(`exists`, () => expect(set).not.toBeFalsy())
          it(`has size 1`, () => expect(set.size).toBe(1))
          it(`contains the "areEqual" binding`, () => {
            const areEqualNodeValue = fas.infoCmp.view
              .findOrFail(isConditionalViewNodeWithVar('areEqual'))
              .getValueOrThrow()
            const [binding] = areEqualNodeValue.viewBindings
            const boundValue = binding.boundValue as ViewBoundPropertyAccess
            const [setItem] = set
            expect(setItem).toBe(boundValue)
          })
        })
      })
      describe(`for App`, () => {
        const map = fas.app.getFaDiffMap()
        it(`has size 3`, () => expect(map.size).toBe(3))
        describe(`set which maps from counter-cmp (first)`, () => {
          const set = map.get(fas.counterCmp1)!
          it(`exists`, () => expect(set).not.toBeFalsy())
          it(`has size 1`, () => expect(set.size).toBe(1))
          it(`contains the "left" binding to input [value]`, () => {
            const counterCmp1NodeValue = fas.app.view.getByChildPath(1)
            // TODO: Missing assertion here.
          })
        })
        describe(`set which maps from counter-cmp (second)`, () => {
          const set = map.get(fas.counterCmp2)!
          it(`exists`, () => expect(set).not.toBeFalsy())
          it(`has size 1`, () => expect(set.size).toBe(1))
          it(`contains the "right" binding to input [value]`, () => {
            const counterCmp2NodeValue = fas.app.view.getByChildPath(3)
            // TODO: Missing assertion here.
          })
        })
        describe(`set which maps from info-cmp`, () => {
          const set = map.get(fas.infoCmp)!
          it(`exists`, () => expect(set).not.toBeFalsy())
          it(`has size 2`, () => expect(set.size).toBe(2))
          it(`contains the "isLeftGreater" binding to [isLeftGreater] input`, () => {
            const infoCmpNodeValue = fas.app.view
              .findOrFail(isCmpNodeWithName('Info'))
              .getValueOrThrow()
            const binding = infoCmpNodeValue.getInputBindingByNameOrFail('isLeftGreater')
            expect(set.has(binding.boundValue as ViewBoundPropertyAccess)).toBe(true)
          })
          it(`contains the "isRightGreater" binding to input [isRightGreater]`, () => {
            const infoCmpNodeValue = fas.app.view
              .findOrFail(isCmpNodeWithName('Info'))
              .getValueOrThrow()
            const binding = infoCmpNodeValue.getInputBindingByNameOrFail('isRightGreater')
            expect(set.has(binding.boundValue as ViewBoundPropertyAccess)).toBe(true)
          })
        })
      })
    })

  })


  describe(`responsibleFor`, () => {

    describe(`01-hello-world`, () => {
      describe(`App`, () => {
        const app = apps.helloWorld.getFactoryTree()
        const responsibleFor = Array.from(app.responsibleFor())
        const [greeting, , someone] = app.view
        it(`has two elements`, () => {
          expect(responsibleFor.length).toBe(2)
        })
        it(`has the {{ greeting }} prop access`, () => {
          expect(responsibleFor.some(res => {
            return res == Array.from(greeting.getValueOrThrow().viewBindings)[0].boundValue
          })).toBe(true)
        })
        it(`has the {{ greeting }} prop access`, () => {
          expect(responsibleFor.some(res => {
            return res == Array.from(someone.getValueOrThrow().viewBindings)[0].boundValue
          })).toBe(true)
        })
      })
    })

    describe(`02-counter`, () => {
      describe(`CounterCmp`, () => {

      })
      describe(`App`, () => {

      })
    })

    describe(`in 03-toggler`, () => {
      const app = apps.toggler.getFactoryTree()
      const [toggleCmp, conditionalView1, conditionalView2] = app.getChildren().values()
      describe(`for ToggleCmp`, () => {
      })
      describe(`for ConditionalView1`, () => {
      })
      describe(`for ConditionalView2`, () => {
      })
      describe(`for App`, () => {
      })
    })

    describe(`in 04-comparator`, () => {
      const app = apps.comparator.getFactoryTree()
      const [counterCmp1, counterCmp2, infoCmp] = app.getChildren().values()
      const [isLeftIsGreater, isRightIsGreater, areEqual] = infoCmp.getChildren().values()
      describe(`for CounterCmp1`, () => {
      })
      describe(`for CounterCmp2`, () => {
      })
      describe(`for IsLeftGreater`, () => {
      })
      describe(`for IsRightGreater`, () => {
      })
      describe(`for AreEqual`, () => {
      })
      describe(`for InfoCmp`, () => {
      })
      describe(`for App`, () => {
      })
    })

  })


  describe(`getNeighbors`, () => {

    describe(`in 03-toggler`, () => {
      const app = apps.toggler.getFactoryTree()
      const [toggleCmp, conditionalView1, conditionalView2] = app.getChildrenFactories()
      describe(`App`, () => {
        it(`returns Toggle, IsJavaScript and IsTypeScript`, () => {
          expect(new Set(app.getNeighbors())).toEqual(new Set([toggleCmp, conditionalView1, conditionalView2]))
        })
      })
    })

    describe(`in 05-deep-ifs`, () => {
      const fas = get05Factories()
      describe(`for CounterCmp1`, () => {
        it(`returns App`, () => {
          expect(new Set(fas.counterCmp1.getNeighbors())).toEqual(new Set([fas.app]))
        })
      })
      describe(`for conditional view with "visibility.b"`, () => {
        it(`returns ifAPartial and ifBPartial`, () => {
          expect(new Set(fas.ifB.getNeighbors())).toEqual(new Set([fas.ifAPartial, fas.ifBPartial]))
        })
      })
      describe(`for partial view with "visibility.b"`, () => {
        it(`returns ifB and ifC`, () => {
          expect(new Set(fas.ifBPartial.getNeighbors())).toEqual(new Set([fas.ifB, fas.ifC]))
        })
      })
    })

  })


  describe(`getPathToRoot`, () => {

    describe(`in 01-hello-world`, () => {
      const fas = get01Factories()
      describe(`for App`, () => {
        it(`returns [App]`, () => {
          expect(fas.app.getPathToRoot()).toEqual([fas.app])
        })
      })
    })

    describe(`in 02-counter`, () => {
      const fas = get02Factories()
      describe(`for CounterCmp`, () => {
        it(`returns [CounterCmp, App]`, () => {
          expect(fas.counterCmp.getPathToRoot()).toEqual([fas.counterCmp, fas.app])
        })
      })
      describe(`for App`, () => {
        it(`returns [App]`, () => {
          expect(fas.app.getPathToRoot()).toEqual([fas.app])
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const fas = get04Factories()
      describe(`for w:if with condition isLeftGreater`, () => {
        it(`returns [IsLeftGreaterDirective, InfoCmp, App]`, () => {
          expect(fas.isLeftGreaterCondDir.getPathToRoot())
            .toEqual([fas.isLeftGreaterCondDir, fas.infoCmp, fas.app])
        })
      })
      describe(`for partial view under w:if with condition isLeftGreater`, () => {
        it(`returns [IsLeftGreaterPartial, isLeftGreaterDirective, InfoCmp, App]`, () => {
          expect(fas.isLeftGreaterPartial.getPathToRoot())
            .toEqual([fas.isLeftGreaterPartial, fas.isLeftGreaterCondDir, fas.infoCmp, fas.app])
        })
      })
    })

  })


  describe(`getDiffablePropNames`, () => {

    describe(`in 01-hello-world`, () => {
      const fas = get01Factories()
      describe(`for App`, () => {
        it(`returns an empty set because both "greeting" and "someone" are read-only`, () => {
          expect(new Set(fas.app.getDiffablePropNames()))
            .toEqual(new Set([]))
        })
      })
    })

    describe(`in 02-counter`, () => {
      const fas = get02Factories()
      describe(`for CounterCmp`, () => {
        it(`returns {value}; even though nothing can change it, it's an input`, () => {
          expect(new Set(fas.counterCmp.getDiffablePropNames()))
            .toEqual(new Set(['value']))
        })
      })
      describe(`for App`, () => {
        it(`returns {count}`, () => {
          expect(new Set(fas.app.getDiffablePropNames()))
            .toEqual(new Set(['count']))
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const fas = get03Factories()
      describe(`for ToggleCmp`, () => {
        it(`returns {value}`, () => {
          expect(new Set(fas.toggleCmp.getDiffablePropNames()))
            .toEqual(new Set(['value']))
        })
      })
      describe(`for w:if with variable "isJavaScript"`, () => {
        it(`returns an empty set`, () => {
          expect(new Set(fas.isJavaScriptCondDir.getDiffablePropNames()))
            .toEqual(new Set([]))
        })
      })
      describe(`for the partial view under w:if with variable "isJavaScript"`, () => {
        it(`returns an empty set`, () => {
          expect(new Set(fas.isJavaScriptPartial.getDiffablePropNames()))
            .toEqual(new Set([]))
        })
      })
      describe(`for App`, () => {
        it(`returns {bool, isJavaScript, isTypeScript}`, () => {
          expect(new Set(fas.app.getDiffablePropNames()))
            .toEqual(new Set(['bool', 'isJavaScript', 'isTypeScript']))
        })
      })
    })

  })


  describe(`getClassName`, () => {

    describe(`in 01-hello-world`, () => {
      const app = apps.helloWorld.getFactoryTree()
      describe(`for App`, () => {
        it(`returns "App"`, () => {
          expect(app.getClassName()).toBe(`App`)
        })
      })
    })

    describe(`02-counter`, () => {
      const app = apps.counter.getFactoryTree()
      const children = Array.from(app.getChildren().values())
      const counterCmp = children[0] as ComponentFactoryAnalyzer
      describe(`Counter`, () => {
        it(`returns "Counter"`, () => {
          expect(counterCmp.getClassName()).toBe(`Counter`)
        })
      })
      describe(`App`, () => {
        it(`returns "App"`, () => {
          expect(app.getClassName()).toBe(`App`)
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const app = apps.toggler.getFactoryTree()
      const children = Array.from(app.getChildren().values())
      const toggleCmp = children[0] as ComponentFactoryAnalyzer
      describe(`for Toggle component`, () => {
        it(`returns "Toggle"`, () => {
          expect(toggleCmp.getClassName()).toBe(`Toggle`)
        })
      })
      describe(`for App`, () => {
        it(`returns "App"`, () => {
          expect(app.getClassName()).toBe(`App`)
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const app = apps.comparator.getFactoryTree()
      const children = Array.from(app.getChildren().values())
      const counterCmp1 = children[0] as ComponentFactoryAnalyzer
      const counterCmp2 = children[1] as ComponentFactoryAnalyzer
      const infoCmp = children[2] as ComponentFactoryAnalyzer
      describe(`for Counter component`, () => {
        it(`returns "Counter"`, () => {
          expect(counterCmp1.getClassName()).toBe(`Counter`)
        })
      })
      describe(`for Counter component`, () => {
        it(`returns "Counter"`, () => {
          expect(counterCmp2.getClassName()).toBe(`Counter`)
        })
      })
      describe(`for Info component`, () => {
        it(`returns "Info"`, () => {
          expect(infoCmp.getClassName()).toBe(`Info`)
        })
      })
      describe(`for App`, () => {
        it(`returns "App"`, () => {
          expect(app.getClassName()).toBe(`App`)
        })
      })
    })

  })

  describe(`canUpdatePropInThisComponentInstanceByCalling`, () => {

    describe(`01-hello-world`, () => {
      describe(`App`, () => {
        it(`throws because there are no methods to call it with`, () => {
          expect(() => apps.helloWorld.getFactoryTree().canUpdatePropInThisComponentInstanceByCalling(`foo`)).toThrow()
        })
      })
    })

    describe(`02-counter`, () => {
      const app = apps.counter.getFactoryTree()
      const children = Array.from(app.getChildren().values())
      const counterCmp = children[0] as ComponentFactoryAnalyzer
      describe(`CounterCmp`, () => {
        it(`returns false for "valueChange"`, () => {
          expect(counterCmp.canUpdatePropInThisComponentInstanceByCalling('valueChange')).toBe(false)
        })
        it(`returns false for "inc (uses "value" but does not update it)`, () => {
          expect(counterCmp.canUpdatePropInThisComponentInstanceByCalling('inc')).toBe(false)
        })
        it(`return false for "dec" (uses "values" but does not update it)`, () => {
          expect(counterCmp.canUpdatePropInThisComponentInstanceByCalling('dec')).toBe(false)
        })
        it(`throws for "value" (it's a prop, not a method)`, () => {
          expect(() => counterCmp.canUpdatePropInThisComponentInstanceByCalling('value')).toThrow()
        })
      })
      describe(`App`, () => {
        it(`returns true for "onCountChange" (updates "count")`, () => {
          expect(app.canUpdatePropInThisComponentInstanceByCalling('onCountChange')).toBe(true)
        })
        it(`throws for "count" (it's a prop, not a method)`, () => {
          expect(() => app.canUpdatePropInThisComponentInstanceByCalling('count')).toThrow()
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const app = apps.toggler.getFactoryTree()
      const children = Array.from(app.getChildren().values())
      const toggleCmp = children[0] as ComponentFactoryAnalyzer
      describe(`for ToggleCmp`, () => {
        it(`returns false for "valueChange"`, () => {
          expect(toggleCmp.canUpdatePropInThisComponentInstanceByCalling('valueChange')).toBe(false)
        })
        it(`returns false for "changeState" (uses "value" but does not change it)`, () => {
          expect(toggleCmp.canUpdatePropInThisComponentInstanceByCalling('changeState')).toBe(false)
        })
        it(`returns false for "value" (it's a prop, not a method)`, () => {
          expect(() => toggleCmp.canUpdatePropInThisComponentInstanceByCalling('value')).toThrow()
        })
      })
      describe(`for App`, () => {
        it(`returns true for "onChange" (changes "bool")`, () => {
          expect(app.canUpdatePropInThisComponentInstanceByCalling('onChange')).toBe(true)
        })
        it(`throws "bool" (it's a prop, not a method)`, () => {
          expect(() => app.canUpdatePropInThisComponentInstanceByCalling('bool')).toThrow()
        })
        it(`throws for "isJavaScript" (it's a getter, not a method)`, () => {
          expect(() => app.canUpdatePropInThisComponentInstanceByCalling('isJavaScript')).toThrow()
        })
        it(`throws for "isTypeScript" (it's a getter, not a method)`, () => {
          expect(() => app.canUpdatePropInThisComponentInstanceByCalling('isTypeScript')).toThrow()
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const app = apps.comparator.getFactoryTree()
      const children = Array.from(app.getChildren().values())
      const counterCmp1 = children[0] as ComponentFactoryAnalyzer
      const counterCmp2 = children[1] as ComponentFactoryAnalyzer
      const infoCmp = children[2] as ComponentFactoryAnalyzer
      describe(`for CounterCmp1`, () => {
      })
      describe(`for CounterCmp2`, () => {
      })
      describe(`for InfoCmp`, () => {
      })
      describe(`for App`, () => {
      })
    })

  })


  describe(`getPropAndGetterNames`, () => {

    describe(`01-hello-world`, () => {
      describe(`App`, () => {
        const app = apps.helloWorld.getFactoryTree()
        it(`returns the two names, greeting and someone`, () => {
          expect(app.getPropAndGetterNames()).toEqual(new Set(['greeting', 'someone']))
        })
      })
    })

    describe(`02-counter`, () => {
      const app = apps.counter.getFactoryTree()
      const children = Array.from(app.getChildren().values())
      const counterCmp = children[0] as ComponentFactoryAnalyzer
      describe(`CounterCmp`, () => {
        it(`returns "value"`, () => {
          expect(counterCmp.getPropAndGetterNames()).toEqual(new Set(['value']))
        })
      })
      describe(`App`, () => {
        it(`returns "count"`, () => {
          expect(app.getPropAndGetterNames()).toEqual(new Set(['count']))
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const app = apps.toggler.getFactoryTree()
      const children = Array.from(app.getChildren().values())
      const toggleCmp = children[0] as ComponentFactoryAnalyzer
      describe(`for ToggleCmp`, () => {
        it(`returns "value"`, () => {
          expect(toggleCmp.getPropAndGetterNames()).toEqual(new Set(['value']))
        })
      })
      describe(`for App`, () => {
        it(`returns "bool", "isJavaScript" and "isTypeScript"`, () => {
          expect(app.getPropAndGetterNames()).toEqual(new Set(['bool', 'isJavaScript', 'isTypeScript']))
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const app = apps.comparator.getFactoryTree()
      const children = Array.from(app.getChildren().values())
      const counterCmp1 = children[0] as ComponentFactoryAnalyzer
      const counterCmp2 = children[1] as ComponentFactoryAnalyzer
      const infoCmp = children[2] as ComponentFactoryAnalyzer
      describe(`for CounterCmp1`, () => {
        it(`returns "value"`, () => {
          expect(counterCmp1.getPropAndGetterNames()).toEqual(new Set(['value']))
        })
      })
      describe(`for CounterCmp2`, () => {
        it(`returns "value"`, () => {
          expect(counterCmp2.getPropAndGetterNames()).toEqual(new Set(['value']))
        })
      })
      describe(`for InfoCmp`, () => {
        it(`returns "isLeftGreater", "isRightGreater", "areEqual" and "isGreaterString"`, () => {
          expect(infoCmp.getPropAndGetterNames())
            .toEqual(new Set(['isLeftGreater', 'isRightGreater', 'areEqual', 'isGreaterString']))
        })
      })
      describe(`for App`, () => {
        it(`returns "left", "right", "isRightGreater" and "isLeftGreater"`, () => {
          expect(app.getPropAndGetterNames()).toEqual(new Set(['left', 'right', 'isLeftGreater', 'isRightGreater']))
        })
      })
    })

  })


  describe(`getMethodNames`, () => {

    describe(`in 01-hello-world`, () => {
      const app = apps.helloWorld.getFactoryTree()
      describe(`for App`, () => {
        it(`returns nothing`, () => {
          expect(app.getMethodNames()).toEqual(new Set())
        })
      })
    })

    describe(`in 02-counter`, () => {
      const app = apps.counter.getFactoryTree()
      const children = Array.from(app.getChildren().values())
      const counterCmp = children[0] as ComponentFactoryAnalyzer
      describe(`for CounterCmp`, () => {
        it(`should return "valueChange", "inc" and "dec"`, () => {
          expect(counterCmp.getMethodNames()).toEqual(new Set(['valueChange', 'inc', 'dec']))
        })
      })
      describe(`for App`, () => {
        it(`should return "onCountChange"`, () => {
          expect(app.getMethodNames()).toEqual(new Set(['onCountChange']))
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const app = apps.toggler.getFactoryTree()
      const children = Array.from(app.getChildren().values())
      const toggleCmp = children[0] as ComponentFactoryAnalyzer
      describe(`for ToggleCmp`, () => {
        it(`returns "valueChange" and "changeState"`, () => {
          expect(toggleCmp.getMethodNames()).toEqual(new Set(['valueChange', 'changeState']))
        })
      })
      describe(`for App`, () => {
        it(`returns "onChange"`, () => {
          expect(app.getMethodNames()).toEqual(new Set(['onChange']))
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const app = apps.comparator.getFactoryTree()
      const children = Array.from(app.getChildren().values())
      const counterCmp1 = children[0] as ComponentFactoryAnalyzer
      const counterCmp2 = children[1] as ComponentFactoryAnalyzer
      const infoCmp = children[2] as ComponentFactoryAnalyzer
      describe(`for CounterCmp1`, () => {
        it(`returns "valueChange", "inc" and "dec"`, () => {
          expect(counterCmp1.getMethodNames()).toEqual(new Set(['valueChange', 'inc', 'dec']))
        })
      })
      describe(`for CounterCmp2`, () => {
        it(`returns "valueChange", "inc" and "dec"`, () => {
          expect(counterCmp2.getMethodNames()).toEqual(new Set(['valueChange', 'inc', 'dec']))
        })
      })
      describe(`for InfoCmp`, () => {
        it(`returns an empty set`, () => {
          expect(infoCmp.getMethodNames()).toEqual(new Set([]))
        })
      })
      describe(`for App`, () => {
        it(`returns "onLeftChange" and "onRightChange"`, () => {
          expect(app.getMethodNames()).toEqual(new Set(['onLeftChange', 'onRightChange']))
        })
      })
    })

  })


})
