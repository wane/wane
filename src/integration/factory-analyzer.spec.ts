import * as apps from './apps'
import {
  ComponentInputBinding,
  ComponentOutputBinding,
  ConditionalViewBinding,
  HtmlElementEventBinding,
  HtmlElementPropBinding,
  InterpolationBinding,
} from '../compiler/template-nodes/view-bindings'
import iterare from 'iterare'
import CodeBlockWriter from 'code-block-writer'
import { ViewBoundPropertyAccess, ViewBoundValue } from '../compiler/template-nodes/view-bound-value'
import {
  isCmpNodeWithName,
  isConditionalViewNodeWithVar,
  isInterpolationNodeWithProp,
} from '../compiler/template-nodes/nodes/utils'
import { isInstance } from '../compiler/utils/utils'
import { ComponentFactoryAnalyzer } from '../compiler/analyzer/factory-analyzer/component-factory-analyzer'
import { repeat } from './utils'
import { FactoryAnalyzer } from '../compiler/analyzer'
import { TemplateNodeValue } from '../compiler/template-nodes/nodes/template-node-value-base'
import { ConditionalViewFactoryAnalyzer } from '../compiler/analyzer/factory-analyzer/conditional-view-factory-analyzer'
import { TemplateNodeComponentValue } from '../compiler/template-nodes/nodes/component-node'
import { TemplateNodeConditionalViewValue } from '../compiler/template-nodes/nodes/conditional-view-node'

function expectWriter (spy: (wr: CodeBlockWriter) => void, expectation: string): void {
  const wr = new CodeBlockWriter({ indentNumberOfSpaces: 2 })
  spy(wr)
  expect(wr.toString().trim()).toBe(expectation.trim())
}

function getDeepIfFactories () {
  const app = apps.deepIfs.getFactoryTree()
  const counterCmps = [...app.getChildrenFactories()].slice(0, 3) as ComponentFactoryAnalyzer[]
  const [counterCmp1, counterCmp2, counterCmp3] = counterCmps
  const toggleCmps = [...app.getChildrenFactories()].slice(3, 6) as ComponentFactoryAnalyzer[]
  const [toggleCmp1, toggleCmp2, toggleCmp3] = toggleCmps
  const [ifA] = [...app.getChildrenFactories()].slice(6, 7) as ConditionalViewFactoryAnalyzer[]
  const [ifB] = ifA.getChildrenFactories() as ConditionalViewFactoryAnalyzer[]
  const [ifC] = ifB.getChildrenFactories() as ConditionalViewFactoryAnalyzer[]
  return {
    app,
    counterCmps, counterCmp1, counterCmp2, counterCmp3,
    toggleCmps, toggleCmp1, toggleCmp2, toggleCmp3,
    ifA, ifB, ifC,
  }
}

describe(`FactoryAnalyzer`, () => {


  describe(`getFirstScopeBoundaryUpwardsIncludingSelf`, () => {

    describe(`in 01-hello-world`, () => {
      describe(`for App`, () => {
        const app = apps.helloWorld.getFactoryTree()
        it(`gets itself`, () => {
          expect(app.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(app)
        })
      })
    })

    describe(`in 02-counter`, () => {
      describe(`for CounterCmp`, () => {
        const counterCmp = apps.counter.getFactoryTree().getFirstChild<ComponentFactoryAnalyzer>()
        it(`gets itself`, () => {
          expect(counterCmp.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(counterCmp)
        })
      })
      describe(`for App`, () => {
        const app = apps.counter.getFactoryTree()
        it(`gets itself`, () => {
          expect(app.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(app)
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const app = apps.toggler.getFactoryTree()
      const [toggleCmp, conditionalView1, conditionalView2] = app.getChildrenFactories()
      describe(`for ToggleCmp`, () => {
        it(`returns App`, () => {
          expect(toggleCmp.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(toggleCmp as ComponentFactoryAnalyzer)
        })
      })
      describe(`for ConditionalView1`, () => {
        it(`returns App`, () => {
          expect(conditionalView1.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(app)
        })
      })
      describe(`for ConditionalView2`, () => {
        it(`returns App`, () => {
          expect(conditionalView2.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(app)
        })
      })
      describe(`for App`, () => {
        it(`returns itself`, () => {
          expect(app.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(app)
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const app = apps.comparator.getFactoryTree()
      const [counterCmp1, counterCmp2, infoCmp] = app.getChildrenFactories()
      const [isLeftIsGreater, isRightIsGreater, areEqual] = infoCmp.getChildrenFactories()
      describe(`for CounterCmp1`, () => {
        it(`returns itself`, () => {
          expect(counterCmp1.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(counterCmp1 as ComponentFactoryAnalyzer)
        })
      })
      describe(`for CounterCmp2`, () => {
        it(`returns itself`, () => {
          expect(counterCmp2.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(counterCmp2 as ComponentFactoryAnalyzer)
        })
      })
      describe(`for IsLeftGreater`, () => {
        it(`returns Info`, () => {
          expect(isLeftIsGreater.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(infoCmp as ComponentFactoryAnalyzer)
        })
      })
      describe(`for IsRightGreater`, () => {
        it(`returns Info`, () => {
          expect(isRightIsGreater.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(infoCmp as ComponentFactoryAnalyzer)
        })
      })
      describe(`for AreEqual`, () => {
        it(`returns Info`, () => {
          expect(areEqual.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(infoCmp as ComponentFactoryAnalyzer)
        })
      })
      describe(`for InfoCmp`, () => {
        it(`returns itself`, () => {
          expect(infoCmp.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(infoCmp as ComponentFactoryAnalyzer)
        })
      })
      describe(`for App`, () => {
        it(`returns itself`, () => {
          expect(app.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(app)
        })
      })
    })

    describe(`in 05-deep-ifs`, () => {
      const cmps = getDeepIfFactories()
      describe(`for ToggleCmp components`, () => {
        it(`returns itself`, () => {
          for (const toggleCmp of cmps.toggleCmps) {
            const actual = toggleCmp.getFirstScopeBoundaryUpwardsIncludingSelf()
            expect(actual).toBe(toggleCmp)
          }
        })
      })
      describe(`for CounterCmp components`, () => {
        it(`returns itself`, () => {
          for (const counterCmp of cmps.counterCmps) {
            const actual = counterCmp.getFirstScopeBoundaryUpwardsIncludingSelf()
            expect(actual).toBe(counterCmp)
          }
        })
      })
      describe(`for w:if with condition "visibility.a"`, () => {
        it(`returns App`, () => {
          const actual = cmps.ifA.getFirstScopeBoundaryUpwardsIncludingSelf()
          expect(actual).toBe(cmps.app)
        })
      })
      describe(`for w:if with condition "visibility.b"`, () => {
        it(`returns App`, () => {
          const actual = cmps.ifB.getFirstScopeBoundaryUpwardsIncludingSelf()
          expect(actual).toBe(cmps.app)
        })
      })
      describe(`for w:if with condition "visibility.c"`, () => {
        it(`returns App`, () => {
          const actual = cmps.ifC.getFirstScopeBoundaryUpwardsIncludingSelf()
          expect(actual).toBe(cmps.app)
        })
      })
      describe(`for App component`, () => {
        it(`returns itself`, () => {
          const actual = cmps.app.getFirstScopeBoundaryUpwardsIncludingSelf()
          expect(actual).toBe(cmps.app)
        })
      })
    })

  })


  describe(`getFactoryName`, () => {

    describe(`01-hello-world`, () => {
      describe(`App`, () => {
        const app = apps.helloWorld.getFactoryTree()
        it(`gets class name appended by a number`, () => {
          expect(app.getFactoryName()).toMatch(/App\d+/)
        })
      })
    })

    describe(`02-counter`, () => {
      describe(`CounterCmp`, () => {
        const counter = apps.counter.getFactoryTree().getFirstChild()
        it(`gets class name appended by a number`, () => {
          expect(counter.getFactoryName()).toMatch(/CounterCmp\d+/)
        })
      })
      describe(`App`, () => {
        const app = apps.counter.getFactoryTree()
        it(`gets class name appended by a number`, () => {
          expect(app.getFactoryName()).toMatch(/App\d+/)
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const app = apps.toggler.getFactoryTree()
      const [toggleCmp, conditionalView1, conditionalView2] = app.getChildrenFactories()
      describe(`for ToggleCmp`, () => {
        it(`gets class name appended by a number`, () => {
          expect(toggleCmp.getFactoryName()).toMatch(/ToggleCmp\d+/)
        })
      })
      describe(`for ConditionalView1`, () => {
        it(`gets type appended by isJavaScript and a number`, () => {
          expect(conditionalView1.getFactoryName()).toMatch(/ConditionalView_isJavaScript_\d+/)
        })
      })
      describe(`for ConditionalView2`, () => {
        it(`gets type appended by isTypeScript and a number`, () => {
          expect(conditionalView2.getFactoryName()).toMatch(/ConditionalView_isTypeScript_\d+/)
        })
      })
      describe(`for App`, () => {
        it(`gets class name appended by a number`, () => {
          expect(app.getFactoryName()).toMatch(/App\d+/)
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const app = apps.comparator.getFactoryTree()
      const [counterCmp1, counterCmp2, infoCmp] = app.getChildrenFactories()
      const [isLeftIsGreater, isRightIsGreater, areEqual] = infoCmp.getChildrenFactories()
      describe(`for CounterCmp1`, () => {
        it(`gets class name with a unique suffix`, () => {
          expect(counterCmp1.getFactoryName()).toMatch(/CounterCmp\d+/)
        })
      })
      describe(`for CounterCmp2`, () => {
        it(`gets class name with a unique suffix`, () => {
          expect(counterCmp2.getFactoryName()).toMatch(/CounterCmp\d+/)
        })
      })
      describe(`for IsLeftGreater`, () => {
        it(`gets type, condition and a unique suffix`, () => {
          expect(isLeftIsGreater.getFactoryName()).toMatch(/ConditionalView_isLeftGreater_\d+/)
        })
      })
      describe(`for IsRightGreater`, () => {
        it(`gets type, condition and a unique suffix`, () => {
          expect(isRightIsGreater.getFactoryName()).toMatch(/ConditionalView_isRightGreater_\d+/)
        })
      })
      describe(`for AreEqual`, () => {
        it(`gets type, condition and a unique suffix`, () => {
          expect(areEqual.getFactoryName()).toMatch(/ConditionalView_areEqual_\d+/)
        })
      })
      describe(`for InfoCmp`, () => {
        it(`gets class name with a unique suffix`, () => {
          expect(infoCmp.getFactoryName()).toMatch(/InfoCmp\d+/)
        })
      })
      describe(`for App`, () => {
        it(`gets class name with a unique suffix`, () => {
          expect(app.getFactoryName()).toMatch(/App\d+/)
        })
      })
    })

    describe(`in 05-deep-ifs`, () => {
      const cmps = getDeepIfFactories()
      describe(`for ToggleCmp components`, () => {
        for (const toggleCmp of cmps.toggleCmps) {
          it(`gets class name with a unique suffix`, () => {
            expect(toggleCmp.getFactoryName()).toMatch(/ToggleCmp\d+/)
          })
        }
      })
      describe(`for CounterCmp components`, () => {
        for (const counterCmp of cmps.counterCmps) {
          it(`gets class name with a unique suffix`, () => {
            expect(counterCmp.getFactoryName()).toMatch(/CounterCmp\d+/)
          })
        }
      })
      describe(`for w:if with condition "visibility.a"`, () => {
        it(`gets type, condition and a unique suffix`, () => {
          expect(cmps.ifA.getFactoryName()).toMatch(/ConditionalView_visibility-a_\d+/)
        })
      })
      describe(`for w:if with condition "visibility.b"`, () => {
        it(`gets type, condition and a unique suffix`, () => {
          expect(cmps.ifB.getFactoryName()).toMatch(/ConditionalView_visibility-b_\d+/)
        })
      })
      describe(`for w:if with condition "visibility.c"`, () => {
        it(`gets type, condition and a unique suffix`, () => {
          expect(cmps.ifC.getFactoryName()).toMatch(/ConditionalView_visibility-c_\d+/)
        })
      })
      describe(`for App component`, () => {
        it(`gets class name with a unique suffix`, () => {
          expect(cmps.app.getFactoryName()).toMatch(/App\d+/)
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
          expect(counter.getFactoryFilename()).toMatch(/counter-cmp\d+/)
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
          expect(toggleCmp.getFactoryFilename()).toMatch(/toggle-cmp\d+/)
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
          expect(counterCmp1.getFactoryFilename()).toMatch(/counter-cmp\d+/)
        })
      })
      describe(`for CounterCmp2`, () => {
        it(`works`, () => {
          expect(counterCmp2.getFactoryFilename()).toMatch(/counter-cmp\d+/)
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
          expect(infoCmp.getFactoryFilename()).toMatch(/info-cmp\d+/)
        })
      })
      describe(`for App`, () => {
        it(`works`, () => {
          expect(app.getFactoryFilename()).toMatch(/app\d+/)
        })
      })
    })

    describe(`in 05-deep-ifs`, () => {
      const cmps = getDeepIfFactories()
      describe(`for ToggleCmp components`, () => {
        for (const toggleCmp of cmps.toggleCmps) {
          it(`gets class name with a unique suffix`, () => {
            expect(toggleCmp.getFactoryFilename()).toMatch(/toggle-cmp\d+/)
          })
        }
      })
      describe(`for CounterCmp components`, () => {
        for (const counterCmp of cmps.counterCmps) {
          it(`gets class name with a unique suffix`, () => {
            expect(counterCmp.getFactoryFilename()).toMatch(/counter-cmp\d+/)
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
          expect(counter.getFactoryFilenameWithExtension()).toBe(`counter-cmp1.ts`)
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
      describe(`App`, () => {
        const app = apps.helloWorld.getFactoryTree()
        it(`returns an empty iterable since there are no child factories`, () => {
          expect(Array.from(app.getChildren()).length).toBe(0)
        })
      })
    })

    describe(`02-counter`, () => {
      const app = apps.counter.getFactoryTree()
      const counter = app.getFirstChild()
      describe(`CounterCmp`, () => {
        it(`returns an empty iterable since there are no child factories`, () => {
          expect(Array.from(counter.getChildren()).length).toBe(0)
        })
      })
      describe(`App`, () => {
        it(`returns a single child, mapping the corresponding node to it`, () => {
          const children = app.getChildren()
          expect(Array.from(children).length).toBe(1)
          const [[node, child]] = children
          expect(node).toEqual(app.view.findOrFail(isCmpNodeWithName('counter-cmp')))
          expect(child).toBe(counter)
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const app = apps.toggler.getFactoryTree()
      const [toggleCmp, conditionalView1, conditionalView2] = app.getChildrenFactories()
      describe(`for ToggleCmp`, () => {
        it(`returns no children`, () => {
          expect(Array.from(toggleCmp.getChildren()).length).toBe(0)
        })
      })
      describe(`for ConditionalView1`, () => {
        it(`returns no children`, () => {
          expect(Array.from(conditionalView1.getChildren()).length).toBe(0)
        })
      })
      describe(`for ConditionalView2`, () => {
        it(`returns no children`, () => {
          expect(Array.from(conditionalView2.getChildren()).length).toBe(0)
        })
      })
      describe(`for App`, () => {
        it(`has three children, mapping corresponding nodes`, () => {
          const children = app.getChildren()
          expect(Array.from(children).length).toBe(3)
          const [[node1, child1], [node2, child2], [node3, child3]] = children
          expect(node1).toEqual(app.view.findOrFail(isCmpNodeWithName('toggle-cmp')))
          expect(child1).toBe(toggleCmp)
          expect(node2).toEqual(app.view.findOrFail(isConditionalViewNodeWithVar(`isJavaScript`)))
          expect(child2).toBe(conditionalView1)
          expect(node3).toEqual(app.view.findOrFail(isConditionalViewNodeWithVar(`isTypeScript`)))
          expect(child3).toBe(conditionalView2)
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const app = apps.comparator.getFactoryTree()
      const [counterCmp1, counterCmp2, infoCmp] = app.getChildrenFactories()
      const [isLeftIsGreater, isRightIsGreater, areEqual] = infoCmp.getChildrenFactories()
      describe(`for CounterCmp1`, () => {
        it(`returns no children`, () => {
          expect(Array.from(counterCmp1.getChildren()).length).toBe(0)
        })
      })
      describe(`for CounterCmp2`, () => {
        it(`returns no children`, () => {
          expect(Array.from(counterCmp1.getChildren()).length).toBe(0)
        })
      })
      describe(`for IsLeftGreater`, () => {

        it(`returns no children`, () => {
          expect(Array.from(isLeftIsGreater.getChildren()).length).toBe(0)
        })
      })
      describe(`for IsRightGreater`, () => {
        it(`returns no children`, () => {
          expect(Array.from(isRightIsGreater.getChildren()).length).toBe(0)
        })
      })
      describe(`for AreEqual`, () => {
        it(`returns no children`, () => {
          expect(Array.from(areEqual.getChildren()).length).toBe(0)
        })
      })
      describe(`for InfoCmp`, () => {
        it(`returns three children, mapping corresponding nodes`, () => {
          const children = infoCmp.getChildren()
          expect(Array.from(children).length).toBe(3)
          const [[node1, child1], [node2, child2], [node3, child3]] = children
          expect(node1).toEqual(infoCmp.view.findOrFail(isConditionalViewNodeWithVar('isLeftGreater')))
          expect(child1).toBe(isLeftIsGreater)
          expect(node2).toEqual(infoCmp.view.findOrFail(isConditionalViewNodeWithVar(`isRightGreater`)))
          expect(child2).toBe(isRightIsGreater)
          expect(node3).toEqual(infoCmp.view.findOrFail(isConditionalViewNodeWithVar(`areEqual`)))
          expect(child3).toBe(areEqual)
        })
      })
      describe(`for App`, () => {
        it(`returns three children, mapping corresponding nodes`, () => {
          const children = app.getChildren()
          expect(Array.from(children).length).toBe(3)
          const [[node1, child1], [node2, child2], [node3, child3]] = children
          expect(node1).toEqual(app.view.getNthRoot(3))
          expect(child1).toBe(counterCmp1)
          expect(node2).toEqual(app.view.getNthRoot(7))
          expect(child2).toBe(counterCmp2)
          expect(node3).toEqual(app.view.findOrFail(isCmpNodeWithName(`info-cmp`)))
          expect(child3).toBe(infoCmp)
        })
      })
    })

    describe(`in 05-deep-ifs`, () => {
      const cmps = getDeepIfFactories()
      describe(`for ToggleCmp components`, () => {
        it(`they have no children`, () => {
          for (const toggleCmp of cmps.toggleCmps) {
            expect(toggleCmp.getChildren().size).toBe(0)
          }
        })
      })
      describe(`for CounterCmp components`, () => {
        it(`they have no children`, () => {
          for (const counterCmp of cmps.counterCmps) {
            expect(counterCmp.getChildren().size).toBe(0)
          }
        })
      })
      describe(`for w:if with condition "visibility.a"`, () => {
        it(`has a single child`, () => {
          expect(cmps.ifA.getChildren().size).toBe(1)
        })
        describe(`the only child`, () => {
          it(`maps w:if "visibility.b"`, () => {
            const [[node, child]] = cmps.ifA.getChildren()
            expect(node.getValue()).toBe(cmps.ifA.view.getByChildPath(3).getValue())
            expect(child).toEqual(cmps.ifB)
          })
        })
      })
      describe(`for w:if with condition "visibility.b"`, () => {
        it(`has a single child`, () => {
          expect(cmps.ifB.getChildren().size).toBe(1)
        })
        describe(`the only child`, () => {
          it(`maps w:if "visiblity.c"`, () => {
            const [[node, child]] = cmps.ifB.getChildren()
            expect(node.getValue()).toBe(cmps.ifB.view.getByChildPath(3).getValue())
            expect(child).toBe(cmps.ifC)
          })
        })
      })
      describe(`for w:if with condition "visibility.c"`, () => {
        it(`has no children`, () => {
          expect(cmps.ifC.getChildren().size).toBe(0)
        })
      })
      describe(`for App component`, () => {
        it(`has 7 children`, () => {
          expect(cmps.app.getChildren().size).toBe(7)
        })
        describe(`first three children`, () => {
          it(`all map correct nodes to correct factories`, () => {
            const [first, second, third] = cmps.app.getChildren()
            expect(first[0].getValue()).toBe(cmps.app.view.getByChildPath(1, 5).getValue())
            expect(first[1]).toBe(cmps.counterCmp1)
            expect(second[0].getValue()).toBe(cmps.app.view.getByChildPath(1, 7).getValue())
            expect(second[1]).toBe(cmps.counterCmp2)
            expect(third[0].getValue()).toBe(cmps.app.view.getByChildPath(1, 9).getValue())
            expect(third[1]).toBe(cmps.counterCmp3)
          })
        })
        describe(`second three children`, () => {
          it(`all map correct nodes to correct factories`, () => {
            const [, , , fourth, fifth, sixth] = cmps.app.getChildren()
            expect(fourth[0].getValue()).toBe(cmps.app.view.getByChildPath(1, 13).getValue())
            expect(fourth[1]).toBe(cmps.toggleCmp1)
            expect(fifth[0].getValue()).toBe(cmps.app.view.getByChildPath(1, 15).getValue())
            expect(fifth[1]).toBe(cmps.toggleCmp2)
            expect(sixth[0].getValue()).toBe(cmps.app.view.getByChildPath(1, 17).getValue())
            expect(sixth[1]).toBe(cmps.toggleCmp3)
          })
        })
        describe(`the last child`, () => {
          it(`maps the correct node to the correct factory`, () => {
            const [, , , , , , [node, child]] = cmps.app.getChildren()
            expect(node.getValue()).toBe(cmps.app.view.getByChildPath(3).getValue())
            expect(child).toBe(cmps.ifA)
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
          const expected = app.view.findOrFail(isCmpNodeWithName(`counter-cmp`))
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
          expect(toggleCmp.getAnchorViewNode()).toEqual(app.view.findOrFail(isCmpNodeWithName('toggle-cmp')))
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
          expect(counterCmp1.getAnchorViewNode()).toEqual(app.view.getNthRoot(3))
        })
      })
      describe(`for CounterCmp2`, () => {
        it(`works`, () => {
          expect(counterCmp2.getAnchorViewNode()).toEqual(app.view.getNthRoot(7))
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
          expect(infoCmp.getAnchorViewNode()).toEqual(app.view.findOrFail(isCmpNodeWithName(`info-cmp`)))
        })
      })
      describe(`for App`, () => {
        it(`throws`, () => {
          expect(() => app.getAnchorViewNode()).toThrow()
        })
      })
    })

    describe(`in 05-deep-ifs`, () => {
      const cmps = getDeepIfFactories()
      describe(`for CounterCmp components`, () => {
        it(`works for the first ToggleCmp`, () => {
          expect(cmps.counterCmp1.getAnchorViewNode().getValue())
            .toBe(cmps.app.view.getByChildPath(1, 5).getValue() as TemplateNodeComponentValue)
        })
        it(`works for the second ToggleCmp`, () => {
          expect(cmps.counterCmp2.getAnchorViewNode().getValue())
            .toBe(cmps.app.view.getByChildPath(1, 7).getValue() as TemplateNodeComponentValue)
        })
        it(`works for the third ToggleCmp`, () => {
          expect(cmps.counterCmp3.getAnchorViewNode().getValue())
            .toBe(cmps.app.view.getByChildPath(1, 9).getValue() as TemplateNodeComponentValue)
        })
      })
      describe(`for ToggleCmp components`, () => {
        it(`works for the first CounterCmp`, () => {
          expect(cmps.toggleCmp1.getAnchorViewNode().getValue())
            .toBe(cmps.app.view.getByChildPath(1, 13).getValue() as TemplateNodeComponentValue)
        })
        it(`works for the second CounterCmp`, () => {
          expect(cmps.toggleCmp2.getAnchorViewNode().getValue())
            .toBe(cmps.app.view.getByChildPath(1, 15).getValue() as TemplateNodeComponentValue)
        })
        it(`works for the third CounterCmp`, () => [
          expect(cmps.toggleCmp3.getAnchorViewNode().getValue())
            .toBe(cmps.app.view.getByChildPath(1, 17).getValue() as TemplateNodeComponentValue),
        ])
      })
      describe(`for w:if with condition "visibility.a"`, () => {
        it(`works`, () => {
          expect(cmps.ifA.getAnchorViewNode().getValue())
            .toBe(cmps.app.view.getByChildPath(3).getValue() as TemplateNodeConditionalViewValue)
        })
      })
      describe(`for w:if with condition "visibility.b"`, () => {
        it(`works`, () => {
          expect(cmps.ifB.getAnchorViewNode().getValue())
            .toBe(cmps.ifA.view.getByChildPath(3).getValue() as TemplateNodeConditionalViewValue)
        })
      })
      describe(`for w:if with condition "visibility.c"`, () => {
        it(`works`, () => {
          expect(cmps.ifC.getAnchorViewNode().getValue())
            .toBe(cmps.ifB.view.getByChildPath(3).getValue() as TemplateNodeConditionalViewValue)
        })
      })
      describe(`for App component`, () => {
        it(`throws because it is the root`, () => {
          expect(() => cmps.app.getAnchorViewNode().getValue()).toThrow()
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
            .toEqual(app.view.findOrFail(isCmpNodeWithName(`counter-cmp`)))
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
      const cmps = getDeepIfFactories()
      describe(`for CounterCmp components`, () => {
        describe(`first`, () => {
          it(`returns [CounterCmp1 -> App -> ifA] to ifA`, () => {
            expect(cmps.counterCmp1.getPathTo(cmps.ifA)).toEqual([
              cmps.counterCmp1,
              cmps.app,
              cmps.ifA,
            ])
          })
        })
        describe(`second`, () => {
          it(`returns [CounterCmp2 -> App -> ifA -> ifB] to ifB`, () => {
            expect(cmps.counterCmp2.getPathTo(cmps.ifB)).toEqual([
              cmps.counterCmp2,
              cmps.app,
              cmps.ifA,
              cmps.ifB,
            ])
          })
        })
      })
      describe(`for ToggleCmp components`, () => {
        describe(`third`, () => {
          it(`returns [ToggleCmp3 -> App -> ifA -> ifB -> ifC] to ifC`, () => {
            expect(cmps.toggleCmp3.getPathTo(cmps.ifC)).toEqual([
              cmps.toggleCmp3,
              cmps.app,
              cmps.ifA,
              cmps.ifB,
              cmps.ifC,
            ])
          })
        })
      })
      describe(`for w:if with condition "visibility.a"`, () => {
        it(`returns [ifA -> App] to App`, () => {
          expect(cmps.ifA.getPathTo(cmps.app)).toEqual([cmps.ifA, cmps.app])
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

    describe(`01-hello-world`, () => {
      describe(`App`, () => {
        const app = apps.helloWorld.getFactoryTree()
        it(`returns itself for "greeting" because it's defined as a class prop`, () => {
          expect(app.hasDefinedAndResolvesTo(`greeting`)).toBe(`greeting`)
        })
        it(`returns itself for "someone" because it's defined as a class prop`, () => {
          expect(app.hasDefinedAndResolvesTo(`someone`)).toBe(`someone`)
        })
        it(`returns null for "foo" because it's not defined as anything`, () => {
          expect(app.hasDefinedAndResolvesTo(`foo`)).toBe(null)
        })
      })
    })

    describe(`02-counter`, () => {
      const app = apps.counter.getFactoryTree()
      const counter = app.getFirstChild()
      describe(`CounterCmp`, () => {
        it(`returns itself for "value" because it's defined as an input`, () => {
          expect(counter.hasDefinedAndResolvesTo(`value`)).toBe(`value`)
        })
        it(`returns itself for "valueChange" because it's defined as an output`, () => {
          expect(counter.hasDefinedAndResolvesTo(`valueChange`)).toBe(`valueChange`)
        })
        it(`returns itself for "inc" because it's defined as a method`, () => {
          expect(counter.hasDefinedAndResolvesTo(`inc`)).toBe(`inc`)
        })
        it(`returns itself for "dec" because it's defined as a method`, () => {
          expect(counter.hasDefinedAndResolvesTo(`dec`)).toBe(`dec`)
        })
        it(`returns null for "count" because it's defined on the App`, () => {
          expect(counter.hasDefinedAndResolvesTo(`count`)).toBe(null)
        })
        it(`returns null for "onCountChange" because it's defined on App`, () => {
          expect(counter.hasDefinedAndResolvesTo(`onCountChange`)).toBe(null)
        })
        it(`returns null for "foo" because it's random`, () => {
          expect(counter.hasDefinedAndResolvesTo(`foo`)).toBe(null)
        })
      })
      describe(`App`, () => {
        it(`returns itself for "count" because it's defined as a class prop`, () => {
          expect(app.hasDefinedAndResolvesTo(`count`)).toBe(`count`)
        })
        it(`returns itself for "onCountChange" because it's defined as a class method`, () => {
          expect(app.hasDefinedAndResolvesTo(`onCountChange`)).toBe(`onCountChange`)
        })
        it(`returns null for "value", "valueChange", "inc" and "dec" because those are defined on Counter`, () => {
          expect(app.hasDefinedAndResolvesTo(`value`)).toBe(null)
          expect(app.hasDefinedAndResolvesTo(`valueChange`)).toBe(null)
          expect(app.hasDefinedAndResolvesTo(`inc`)).toBe(null)
          expect(app.hasDefinedAndResolvesTo(`dec`)).toBe(null)
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const app = apps.toggler.getFactoryTree()
      const [toggleCmp, conditionalView1, conditionalView2] = app.getChildrenFactories()
      describe(`for ToggleCmp`, () => {
        it(`returns itself for "value" because it's defined as class prop`, () => {
          expect(toggleCmp.hasDefinedAndResolvesTo(`value`)).toBe(`value`)
        })
        it(`returns itself for "valueChange" because it's defined as a class method`, () => {
          expect(toggleCmp.hasDefinedAndResolvesTo(`valueChange`)).toBe(`valueChange`)
        })
        it(`returns itself for "changeState" because it's a class method`, () => {
          expect(toggleCmp.hasDefinedAndResolvesTo(`changeState`)).toBe(`changeState`)
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
          expect(app.hasDefinedAndResolvesTo(`bool`)).toBe(`bool`)
        })
        it(`returns itself for "onChange" because it's a class method`, () => {
          expect(app.hasDefinedAndResolvesTo(`onChange`)).toBe(`onChange`)
        })
        it(`returns itself for "isJavaScript" because it's a class getter`, () => {
          expect(app.hasDefinedAndResolvesTo(`isJavaScript`)).toBe(`isJavaScript`)
        })
        it(`returns itself for "isTypeScript" because it's a class getter`, () => {
          expect(app.hasDefinedAndResolvesTo(`isTypeScript`)).toBe(`isTypeScript`)
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
          expect(infoCmp.hasDefinedAndResolvesTo('isLeftGreater')).toBe('isLeftGreater')
        })
        it(`returns itself for "areEqual"`, () => {
          expect(infoCmp.hasDefinedAndResolvesTo('areEqual')).toBe('areEqual')
        })
        it(`returns itself for "isGreaterString"`, () => {
          expect(infoCmp.hasDefinedAndResolvesTo('isGreaterString')).toBe('isGreaterString')
        })
      })
      describe(`for App`, () => {
        it(`returns itself for "left"`, () => {
          expect(app.hasDefinedAndResolvesTo('left')).toBe('left')
        })
        it(`returns itself for "onLeftChange"`, () => {
          expect(app.hasDefinedAndResolvesTo('onLeftChange')).toBe('onLeftChange')
        })
        it(`returns itself for "isRightGreater"`, () => {
          expect(app.hasDefinedAndResolvesTo('isRightGreater')).toBe('isRightGreater')
        })
      })
    })

    describe(`in 05-deep-ifs`, () => {
      const cmps = getDeepIfFactories()
      describe(`for ToggleCmp components`, () => {
        describe(`first`, () => {
          it(`returns itself for "value"`, () => {
            expect(cmps.toggleCmp1.hasDefinedAndResolvesTo('value')).toBe('value')
          })
          it(`returns itself for "changeState"`, () => {
            expect(cmps.toggleCmp1.hasDefinedAndResolvesTo('valueChange')).toBe('valueChange')
          })
        })
      })
      describe(`for CounterCmp components`, () => {
        describe(`first`, () => {
          it(`returns itself for "value"`, () => {
            expect(cmps.counterCmp1.hasDefinedAndResolvesTo('value')).toBe('value')
          })
          it(`returns itself for "dec"`, () => {
            expect(cmps.counterCmp1.hasDefinedAndResolvesTo('dec')).toBe('dec')
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
          expect(cmps.app.hasDefinedAndResolvesTo('values.a')).toBe('values.a')
        })
        it(`returns itself for "visibility.b"`, () => {
          expect(cmps.app.hasDefinedAndResolvesTo('visibility.b')).toBe('visibility.b')
        })
        it(`returns itself for "onToggle`, () => {
          expect(cmps.app.hasDefinedAndResolvesTo('onToggle')).toBe('onToggle')
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
      const cmps = getDeepIfFactories()
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
        it(`returns an iterable of length five, all interpolations (and texts)`, () => {
          const bindings = Array.from(app.getHtmlNativeDomBindings())
          expect(bindings.length).toBe(5)
          expect(bindings.every(isInstance(InterpolationBinding))).toBe(true)
        })
      })
    })

    describe(`in 02-counter`, () => {
      const app = apps.counter.getFactoryTree()
      describe(`for CounterCmp`, () => {
        const counterCmp = app.getFirstChild()
        it(`returns an iterable of length nine: ws, (click), 'Decrement', ws, {{ value }}, ws, (click), 'Increment', ws`, () => {
          const bindings = Array.from(counterCmp.getHtmlNativeDomBindings())
          expect(bindings.length).toBe(9)
          expect(bindings[0] instanceof InterpolationBinding).toBe(true, `ws`)
          expect(bindings[1] instanceof HtmlElementEventBinding).toBe(true, `(click)`)
          expect(bindings[2] instanceof InterpolationBinding).toBe(true, `ws`)
          expect(bindings[3] instanceof InterpolationBinding).toBe(true, `ws`)
          expect(bindings[4] instanceof HtmlElementEventBinding).toBe(true, `(click)`)
          expect(bindings[5] instanceof InterpolationBinding).toBe(true, `ws`)
          expect(bindings[6] instanceof InterpolationBinding).toBe(true, `'Decrement'`)
          expect(bindings[7] instanceof InterpolationBinding).toBe(true, `{{ value }}`)
          expect(bindings[8] instanceof InterpolationBinding).toBe(true, `'Increment'`)
        })
      })
      describe(`for App`, () => {
        it(`returns an iterable of length 2: ws, ws`, () => {
          const bindings = Array.from(app.getHtmlNativeDomBindings())
          expect(bindings.length).toBe(2)
          expect(bindings.every(isInstance(InterpolationBinding))).toBe(true)
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const app = apps.toggler.getFactoryTree()
      const [toggleCmp, conditionalView1, conditionalView2] = app.getChildrenFactories()
      describe(`for ToggleCmp`, () => {
        it(`returns an iterable of length six: ws, (click), ws, text, interpolation, text`, () => {
          const bindings = Array.from(toggleCmp.getHtmlNativeDomBindings())
          expect(bindings.length).toBe(6)
          expect(bindings[0] instanceof InterpolationBinding).toBe(true)
          expect(bindings[1] instanceof HtmlElementEventBinding).toBe(true)
          expect(bindings[2] instanceof InterpolationBinding).toBe(true)
          expect(bindings[3] instanceof InterpolationBinding).toBe(true)
          expect(bindings[4] instanceof InterpolationBinding).toBe(true)
          expect(bindings[5] instanceof InterpolationBinding).toBe(true)
        })
      })
      describe(`for ConditionalView1`, () => {
        it(`returns an iterable of length 4: ws, span, ws, "JavaScript"`, () => {
          const bindings = Array.from(conditionalView1.getHtmlNativeDomBindings())
          expect(bindings.length).toBe(4)
          expect(bindings[0] instanceof InterpolationBinding).toBe(true, `0 ws`)
          expect(bindings[1] instanceof HtmlElementPropBinding).toBe(true, `1 span`)
          expect(bindings[2] instanceof InterpolationBinding).toBe(true, `2 ws`)
          expect(bindings[3] instanceof InterpolationBinding).toBe(true, `4 JavaScript`)
        })
      })
      describe(`for ConditionalView2`, () => {
        it(`returns an iterable of length 4: ws, span, ws, "TypeScript"`, () => {
          const bindings = Array.from(conditionalView2.getHtmlNativeDomBindings())
          expect(bindings.length).toBe(4)
          expect(bindings[0] instanceof InterpolationBinding).toBe(true, `0 ws`)
          expect(bindings[1] instanceof HtmlElementPropBinding).toBe(true, `1 span`)
          expect(bindings[2] instanceof InterpolationBinding).toBe(true, `2 ws`)
          expect(bindings[3] instanceof InterpolationBinding).toBe(true, `4 JavaScript`)
        })
      })
      describe(`for App`, () => {
        it(`returns an iterable of length four: ws, text, ws, ws`, () => {
          const bindings = Array.from(app.getHtmlNativeDomBindings())
          expect(bindings.length).toBe(4)
          expect(bindings.every(isInstance(InterpolationBinding))).toBe(true)
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const app = apps.comparator.getFactoryTree()
      const [counterCmp1, counterCmp2, infoCmp] = app.getChildrenFactories()
      const [isLeftIsGreater, isRightIsGreater, areEqual] = infoCmp.getChildrenFactories()
      describe(`for CounterCmp1 and CounterCmp2`, () => {
        it(`returns an iterable of length 9: ws, (click), ws, ws, (click), ws, "Decrement", {{ value }}, "Increment"`, () => {
          for (const counterCmp of [counterCmp1, counterCmp2]) {
            const bindings = Array.from(counterCmp.getHtmlNativeDomBindings())
            expect(bindings.length).toBe(9)
            expect(bindings[0] instanceof InterpolationBinding).toBe(true)
            expect(bindings[1] instanceof HtmlElementEventBinding).toBe(true)
            expect(bindings[2] instanceof InterpolationBinding).toBe(true)
            expect(bindings[3] instanceof InterpolationBinding).toBe(true)
            expect(bindings[4] instanceof HtmlElementEventBinding).toBe(true)
            expect(bindings[5] instanceof InterpolationBinding).toBe(true)
            expect(bindings[6] instanceof InterpolationBinding).toBe(true)
            expect(bindings[7] instanceof InterpolationBinding).toBe(true)
            expect(bindings[8] instanceof InterpolationBinding).toBe(true)
          }
        })
      })
      describe(`for IsLeftGreater`, () => {
        it(`returns an iterable of length 2: "left ", {{ isGreaterString }}`, () => {
          const bindings = Array.from(isLeftIsGreater.getHtmlNativeDomBindings())
          expect(bindings.length).toBe(2)
          expect(bindings[0] instanceof InterpolationBinding).toBe(true)
          expect(bindings[1] instanceof InterpolationBinding).toBe(true)
        })
      })
      describe(`for IsRightGreater`, () => {
        it(`returns an iterable of length 2: "left ", {{ isGreaterString }}`, () => {
          const bindings = Array.from(isRightIsGreater.getHtmlNativeDomBindings())
          expect(bindings.length).toBe(2)
          expect(bindings[0] instanceof InterpolationBinding).toBe(true)
          expect(bindings[1] instanceof InterpolationBinding).toBe(true)
        })
      })
      describe(`for AreEqual`, () => {
        it(`returns an iterable of length 1: "they are equal"`, () => {
          const bindings = Array.from(areEqual.getHtmlNativeDomBindings())
          expect(bindings.length).toBe(1)
          expect(bindings[0] instanceof InterpolationBinding).toBe(true)
        })
      })
      describe(`for InfoCmp`, () => {
        it(`returns an iterable of length 4: ws, ws, ws, ws`, () => {
          const bindings = Array.from(infoCmp.getHtmlNativeDomBindings())
          expect(bindings.length).toBe(4)
          expect(bindings.every(binding => binding instanceof InterpolationBinding)).toBe(true)
        })
      })
      describe(`for App`, () => {
        it(`returns an iterable of length 10: ws, ws, ws, ws, ws, ws, ws, "Left number", "Right number", "Info"`, () => {
          const bindings = Array.from(app.getHtmlNativeDomBindings())
          expect(bindings.length).toBe(10)
          expect(bindings.every(binding => binding instanceof InterpolationBinding)).toBe(true)
        })
      })
    })

    describe(`in 05-deep-ifs`, () => {
      const cmps = getDeepIfFactories()
      describe(`for ToggleCmp components`, () => {
        for (const toggleCmp of cmps.toggleCmps) {
          it(`returns an iterable of length of 6: ws, (click), ws, text, interpol, text`, () => {
            const bindings = [...toggleCmp.getHtmlNativeDomBindings()]
            expect(bindings.length).toBe(6)
            expect(bindings.map(binding => binding.constructor)).toEqual([
              InterpolationBinding,
              HtmlElementEventBinding,
              InterpolationBinding,
              InterpolationBinding,
              InterpolationBinding,
              InterpolationBinding,
            ])
          })
        }
      })
      describe(`for CounterCmp components`, () => {
        for (const counterCmp of cmps.counterCmps) {
          it(`returns an iterable of length 9: ws, (click), ws, ws, (click), ws, tex, interpol, text`, () => {
            const bindings = [...counterCmp.getHtmlNativeDomBindings()]
            expect(bindings.map(binding => binding.constructor)).toEqual([
              InterpolationBinding,
              HtmlElementEventBinding,
              InterpolationBinding,
              InterpolationBinding,
              HtmlElementEventBinding,
              InterpolationBinding,
              InterpolationBinding,
              InterpolationBinding,
              InterpolationBinding,
            ])
          })
        }
      })
      describe(`for w:if with condition "visibility.a"`, () => {
        it(`returns an iterable of length 4: text, interpol, ws, ws`, () => {
          const bindings = [...cmps.ifA.getHtmlNativeDomBindings()]
          expect(bindings.map(binding => binding.constructor)).toEqual([
            InterpolationBinding,
            InterpolationBinding,
            InterpolationBinding,
            InterpolationBinding,
          ])
        })
      })
      describe(`for w:if with condition "visibility.b"`, () => {
        it(`returns an iterable of length 5: text, interpol, ws, ws`, () => {
          const bindings = [...cmps.ifB.getHtmlNativeDomBindings()]
          expect(bindings.map(binding => binding.constructor)).toEqual([
            InterpolationBinding,
            InterpolationBinding,
            InterpolationBinding,
            InterpolationBinding,
          ])
        })
      })
      describe(`for w:if with condition "visibility.c"`, () => {
        it(`returns an iterable of length 3: text, interpol, ws`, () => {
          const bindings = [...cmps.ifC.getHtmlNativeDomBindings()]
          expect(bindings.map(binding => binding.constructor)).toEqual([
            InterpolationBinding,
            InterpolationBinding,
            InterpolationBinding,
          ])
        })
      })
      describe(`for App component`, () => {
        it(`returns a huge iterable`, () => {
          const bindings = [...cmps.app.getHtmlNativeDomBindings()]
          expect(bindings.map(b => b.constructor)).toEqual([
            InterpolationBinding, // ws before <div>
            InterpolationBinding, // ws after </div> and before <w:if>
            InterpolationBinding, // ws after </w:if>
            InterpolationBinding, // ws after <div>
            InterpolationBinding, // ws after </h1>
            InterpolationBinding, // "a: "
            InterpolationBinding, // "b: "
            InterpolationBinding, // "c: "
            InterpolationBinding, // ws before <h2>
            InterpolationBinding, // "a: "
            InterpolationBinding, // "b: "
            InterpolationBinding, // "c: "
            InterpolationBinding, // ws after last toggle-cmp
            InterpolationBinding, // "Controls"
            InterpolationBinding, // "Values"
            InterpolationBinding, // "Visibility"
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
      const cmps = getDeepIfFactories()
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
      const cmps = getDeepIfFactories()
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
        const [whitespace, greeting, comma, someone, exclamation] =
          iterare(app.view.getRoots()).map(tn => tn.getValueOrThrow()).toArray()
        it(`gets index 0 for the leading whitespace`, () => {
          expect(app.getIndexesFor(whitespace)).toEqual([0])
        })
        it(`gets index 1 for the greeting`, () => {
          expect(app.getIndexesFor(greeting)).toEqual([1])
        })
        it(`gets index 2 for the comma`, () => {
          expect(app.getIndexesFor(comma)).toEqual([2])
        })
        it(`gets index 3 for the someone`, () => {
          expect(app.getIndexesFor(someone)).toEqual([3])
        })
        it(`gets index 4 for the exclamation`, () => {
          expect(app.getIndexesFor(exclamation)).toEqual([4])
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
    //   const cmps = getDeepIfFactories()
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
        const [whitespace, greeting, comma, someone, exclamation] =
          iterare(app.view.getRoots()).map(tn => tn.getValueOrThrow()).toArray()
        it(`gets index 0 for the leading whitespace`, () => {
          expect(app.getSingleIndexFor(whitespace)).toEqual(0)
        })
        it(`gets index 1 for the greeting`, () => {
          expect(app.getSingleIndexFor(greeting)).toEqual(1)
        })
        it(`gets index 2 for the comma`, () => {
          expect(app.getSingleIndexFor(comma)).toEqual(2)
        })
        it(`gets index 3 for the someone`, () => {
          expect(app.getSingleIndexFor(someone)).toEqual(3)
        })
        it(`gets index 4 for the exclamation`, () => {
          expect(app.getSingleIndexFor(exclamation)).toEqual(4)
        })
      })
    })

    // Enough!

  })


  describe(`getSavedNodes`, () => {

    describe(`01-hello-world`, () => {
      describe(`App`, () => {
        const app = apps.helloWorld.getFactoryTree()
        const [whitespace, greeting, comma, someone, exclamation] =
          iterare(app.view).map(tn => tn.getValueOrThrow()).toArray()
        it(`gets all nodes`, () => {
          expect(app.getSavedNodes()).toEqual([whitespace, greeting, comma, someone, exclamation])
        })
      })
    })

    // Too difficult to test properly, it's not testing anything judging by how we grab stuff.

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
          expectComponentRoot(counterCmp, 1, 1)
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
        it(`prints assigning the second node of parent`, () => {
          expectComponentRoot(toggleCmp, 1, 1)
        })
      })
      describe(`for ConditionalView1`, () => {
        it(`prints assigning the fourth and fifth parent's node`, () => {
          expectDirectiveRoot(conditionalView1, 1, 3, 4)
        })
      })
      describe(`for ConditionalView2`, () => {
        it(`prints assigning the seventh and eights parent's node`, () => {
          expectDirectiveRoot(conditionalView2, 1, 6, 7)
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
        it(`prints assigning the parent node with index 3`, () => {
          expectComponentRoot(counterCmp1, 1, 3)
        })
      })
      describe(`for CounterCmp2`, () => {
        it(`prints assigning the parent node with index 7`, () => {
          expectComponentRoot(counterCmp2, 1, 7)
        })
      })
      describe(`for IsLeftGreater`, () => {
        it(`prints assigning the parent nodes with index 1 and 2`, () => {
          expectDirectiveRoot(isLeftIsGreater, 1, 1, 2)
        })
      })
      describe(`for IsRightGreater`, () => {
        it(`prints assigning the parent nodes with index 4 and 5`, () => {
          expectDirectiveRoot(isRightIsGreater, 1, 4, 5)
        })
      })
      describe(`for AreEqual`, () => {
        it(`prints assigning the parent nodes with index 7 and 8`, () => {
          expectDirectiveRoot(areEqual, 1, 7, 8)
        })
      })
      describe(`for InfoCmp`, () => {
        it(`prints assigning to the parent node with index 11`, () => {
          expectComponentRoot(infoCmp, 1, 11)
        })
      })
      describe(`for App`, () => {
        it(`prints assigning the document body`, () => {
          expectWriter(
            wr => app.printRootDomNodeAssignment(wr),
            `this.__wane__root = document.body`,
          )
        })
      })
    })

    describe(`in 05-deep-ifs`, () => {
      const cmps = getDeepIfFactories()
      describe(`for ToggleCmp components`, () => {
        describe(`first`, () => {
          it(`prints assigning to parent node with index 19`, () => {
            expectComponentRoot(cmps.toggleCmp1, 1, 19)
          })
        })
        describe(`second`, () => {
          it(`prints assigning to parent node with index 21`, () => {
            expectComponentRoot(cmps.toggleCmp2, 1, 21)
          })
        })
        describe(`third`, () => {
          it(`prints assigning to parent node with index 23`, () => {
            expectComponentRoot(cmps.toggleCmp3, 1, 23)
          })
        })
      })
      describe(`for CounterCmp components`, () => {
        describe(`first`, () => {
          it(`prints assigning to parent node with index 11`, () => {
            expectComponentRoot(cmps.counterCmp1, 1, 11)
          })
        })
        describe(`second`, () => {
          it(`prints assigning to parent node with index 13`, () => {
            expectComponentRoot(cmps.counterCmp2, 1, 13)
          })
        })
        describe(`third`, () => {
          it(`prints assigning to parent node with index 15`, () => {
            expectComponentRoot(cmps.counterCmp3, 1, 15)
          })
        })
      })
      describe(`for w:if with condition "visibility.a"`, () => {
        it(`prints assigning to parent with indexes 3 and 4`, () => {
          expectDirectiveRoot(cmps.ifA, 1, 3, 4)
        })
      })
      describe(`for w:if with condition "visibility.b"`, () => {
        it(`prints assigning to parent with indexes 3 and 4`, () => {
          expectDirectiveRoot(cmps.ifB, 1, 3, 4)
        })
      })
      describe(`for w:if with condition "visibility.c"`, () => {
        it(`prints assigning to aprent with indexes 3 and 4`, () => {
          expectDirectiveRoot(cmps.ifC, 1, 3, 4)
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
      const app = apps.helloWorld.getFactoryTree()
      describe(`for App`, () => {
        it(`returns an empty iterable when skipSelf is true`, () => {
          expect(Array.from(app.factoryAnalyzersInScope({ skipSelf: true }))).toEqual([])
        })
        it(`returns an iterable with itself when skipSelf is false`, () => {
          expect(Array.from(app.factoryAnalyzersInScope({ skipSelf: false }))).toEqual([app])
        })
      })
    })

    describe(`in 02-counter`, () => {
      const app = apps.counter.getFactoryTree()
      const [counterCmp] = app.getChildren().values()
      describe(`for CounterCmp`, () => {
        it(`returns an empty iterable when skipSelf is true`, () => {
          expect(Array.from(counterCmp.factoryAnalyzersInScope({ skipSelf: true }))).toEqual([])
        })
        it(`returns an iterable with itself when skipSelf is false`, () => {
          expect(Array.from(counterCmp.factoryAnalyzersInScope({ skipSelf: false }))).toEqual([counterCmp])
        })
      })
      describe(`for App`, () => {
        it(`returns an iterable with CounterCmp when skipSelf is true`, () => {
          expect(Array.from(app.factoryAnalyzersInScope({ skipSelf: true }))).toEqual([counterCmp])
        })
        it(`returns an iterable with CounterCmp and itself when skipSelf is false`, () => {
          expect(Array.from(app.factoryAnalyzersInScope({ skipSelf: false }))).toEqual([app, counterCmp])
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const app = apps.toggler.getFactoryTree()
      const [toggleCmp, conditionalView1, conditionalView2] = app.getChildren().values()
      describe(`for ToggleCmp`, () => {
        it(`returns an empty iterable when skipSelf is true`, () => {
          expect(Array.from(toggleCmp.factoryAnalyzersInScope({ skipSelf: true }))).toEqual([])
        })
        it(`returns an iterable with itself when skipSelf is false`, () => {
          expect(Array.from(toggleCmp.factoryAnalyzersInScope({ skipSelf: false }))).toEqual([toggleCmp])
        })
      })
      describe(`for ConditionalView1`, () => {
        it(`returns an empty iterable when skipSelf is true`, () => {
          expect(Array.from(conditionalView1.factoryAnalyzersInScope({ skipSelf: true }))).toEqual([])
        })
        it(`returns an iterable with itself when skipSelf is false`, () => {
          expect(Array.from(conditionalView1.factoryAnalyzersInScope({ skipSelf: false }))).toEqual([conditionalView1])
        })
      })
      describe(`for ConditionalView2`, () => {
        it(`returns an empty iterable when skipSelf is true`, () => {
          expect(Array.from(conditionalView2.factoryAnalyzersInScope({ skipSelf: true }))).toEqual([])
        })
        it(`returns an iterable with itself when skipSelf is false`, () => {
          expect(Array.from(conditionalView2.factoryAnalyzersInScope({ skipSelf: false }))).toEqual([conditionalView2])
        })
      })
      describe(`for App`, () => {
        it(`returns an iterable with ToggleCmp, IsJavaScript and IsTypeScript when skipSelf is true`, () => {
          expect(Array.from(app.factoryAnalyzersInScope({ skipSelf: true })))
            .toEqual([toggleCmp, conditionalView1, conditionalView2])
        })
        it(`returns an iterable with ToggleCmp, IsJavaScript, IsTypeScript and itself when skipSelf is false`, () => {
          expect(Array.from(app.factoryAnalyzersInScope({ skipSelf: false })))
            .toEqual([app, toggleCmp, conditionalView1, conditionalView2])
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const app = apps.comparator.getFactoryTree()
      const [counterCmp1, counterCmp2, infoCmp] = app.getChildren().values()
      const [isLeftIsGreater, isRightIsGreater, areEqual] = infoCmp.getChildren().values()
      describe(`for CounterCmp1`, () => {
        it(`returns an empty iterable when skipSelf is true`, () => {
          expect(Array.from(counterCmp1.factoryAnalyzersInScope({ skipSelf: true }))).toEqual([])
        })
        it(`returns an iterable with itself when skipSelf is false`, () => {
          expect(Array.from(counterCmp1.factoryAnalyzersInScope({ skipSelf: false }))).toEqual([counterCmp1])
        })
      })
      describe(`for CounterCmp2`, () => {
        it(`returns an empty iterable when skipSelf is true`, () => {
          expect(Array.from(counterCmp2.factoryAnalyzersInScope({ skipSelf: true }))).toEqual([])
        })
        it(`returns an iterable with itself when skipSelf is false`, () => {
          expect(Array.from(counterCmp2.factoryAnalyzersInScope({ skipSelf: false }))).toEqual([counterCmp2])
        })
      })
      describe(`for IsLeftGreater`, () => {
        it(`returns an empty iterable when skipSelf is true`, () => {
          expect(Array.from(isLeftIsGreater.factoryAnalyzersInScope({ skipSelf: true }))).toEqual([])
        })
        it(`returns an iterable with itself when skipSelf is false`, () => {
          expect(Array.from(isLeftIsGreater.factoryAnalyzersInScope({ skipSelf: false }))).toEqual([isLeftIsGreater])
        })
      })
      describe(`for IsRightGreater`, () => {
        it(`returns an empty iterable when skipSelf is true`, () => {
          expect(Array.from(isRightIsGreater.factoryAnalyzersInScope({ skipSelf: true }))).toEqual([])
        })
        it(`returns an iterable with itself when skipSelf is false`, () => {
          expect(Array.from(isRightIsGreater.factoryAnalyzersInScope({ skipSelf: false }))).toEqual([isRightIsGreater])
        })
      })
      describe(`for AreEqual`, () => {
        it(`returns an empty iterable when skipSelf is true`, () => {
          expect(Array.from(areEqual.factoryAnalyzersInScope({ skipSelf: true }))).toEqual([])
        })
        it(`returns an iterable with itself when skipSelf is false`, () => {
          expect(Array.from(areEqual.factoryAnalyzersInScope({ skipSelf: false }))).toEqual([areEqual])
        })
      })
      describe(`for InfoCmp`, () => {
        it(`returns an iterable with IsLeftGreater, IsRightGreater and AreEqual when skipSelf is true`, () => {
          expect(Array.from(infoCmp.factoryAnalyzersInScope({ skipSelf: true })))
            .toEqual([isLeftIsGreater, isRightIsGreater, areEqual])
        })
        it(`returns an iterable with itself, IsLeftGreater, IsRightGreater and AreEqual when skipSelf is false`, () => {
          expect(Array.from(infoCmp.factoryAnalyzersInScope({ skipSelf: false })))
            .toEqual([infoCmp, isLeftIsGreater, isRightIsGreater, areEqual])
        })
      })
      describe(`for App`, () => {
        it(`returns an iterable with CounterCmp, CounterCmp and InfoCmp when skipSelf is true`, () => {
          expect(Array.from(app.factoryAnalyzersInScope({ skipSelf: true }))).toEqual([counterCmp1,
            counterCmp2,
            infoCmp,
          ])
        })
        it(`returns an iterable with itself, CounterCmp, CounterCmp and InfoCmp when skipSelf is false`, () => {
          expect(Array.from(app.factoryAnalyzersInScope({ skipSelf: false })))
            .toEqual([app, counterCmp1, counterCmp2, infoCmp])
        })
      })
    })

    describe(`in 05-deep-ifs`, () => {
      const cmps = getDeepIfFactories()
      describe(`for ToggleCmp components`, () => {
        for (const toggleCmp of cmps.toggleCmps) {
          it(`is an empty iterable`, () => [
            expect([...toggleCmp.factoryAnalyzersInScope({ skipSelf: true })].length).toBe(0),
          ])
        }
      })
      describe(`for CounterCmp components`, () => {
        for (const counterCmp of cmps.counterCmps) {
          it(`is an empty iterable`, () => [
            expect([...counterCmp.factoryAnalyzersInScope({ skipSelf: true })].length).toBe(0),
          ])
        }
      })
      describe(`for w:if with condition "visibility.a"`, () => {
        it(`is {ifA, ifB, ifC} including self`, () => {
          const actual = [...cmps.ifA.factoryAnalyzersInScope()]
          expect(actual.length).toBe(3)
          expect(actual.some(x => x == cmps.ifA)).toBe(true)
          expect(actual.some(x => x == cmps.ifB)).toBe(true)
          expect(actual.some(x => x == cmps.ifC)).toBe(true)
        })
      })
      describe(`for w:if with condition "visibility.b"`, () => {
        it(`is {ifA, ifB, ifC} including self`, () => {
          const actual = [...cmps.ifB.factoryAnalyzersInScope()]
          expect(actual.length).toBe(2)
          expect(actual.some(x => x == cmps.ifB)).toBe(true)
          expect(actual.some(x => x == cmps.ifC)).toBe(true)
        })
      })
      describe(`for w:if with condition "visibility.c"`, () => {
        it(`is {ifA, ifB, ifC} excluding self`, () => {
          const actual = [...cmps.ifC.factoryAnalyzersInScope()]
          expect(actual.length).toBe(1)
          expect(actual.some(x => x == cmps.ifC)).toBe(true)
        })
      })
      describe(`for App component`, () => {
        it(`is {App, ifA, ifB, ifC} including self`, () => {
          const actual = [...cmps.app.factoryAnalyzersInScope()]
          expect(actual.length).toBe(10)
          expect(actual.some(x => x == cmps.counterCmp1)).toBe(true)
          expect(actual.some(x => x == cmps.counterCmp2)).toBe(true)
          expect(actual.some(x => x == cmps.counterCmp3)).toBe(true)
          expect(actual.some(x => x == cmps.toggleCmp1)).toBe(true)
          expect(actual.some(x => x == cmps.toggleCmp2)).toBe(true)
          expect(actual.some(x => x == cmps.toggleCmp3)).toBe(true)
          expect(actual.some(x => x == cmps.ifA)).toBe(true)
          expect(actual.some(x => x == cmps.ifB)).toBe(true)
          expect(actual.some(x => x == cmps.ifC)).toBe(true)
          expect(actual.some(x => x == cmps.app)).toBe(true)
          // TODO: I really need the "iteratesInAnyOrderLike"
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
        const [_, greeting, __, someone] = app.view
        const domDiffMap = app.getDomDiffMap()
        it(`has two entries`, () => {
          expect(Array.from(domDiffMap).length).toBe(2)
        })
        it(`maps #1 ({{ greeting }}) to a set ["greeting"]`, () => {
          const one = Array.from(domDiffMap.get(1)!) as ViewBoundValue[]
          const greetingBoundValues = iterare(greeting.getValueOrThrow().viewBindings)
            .map(vb => vb.boundValue)
            .toArray() as ViewBoundValue[]
          expect(one).toEqual(greetingBoundValues)
        })
        it(`maps #3 ({{ someone }}) to a set ["someone"]`, () => {
          const three = Array.from(domDiffMap.get(3)!) as ViewBoundValue[]
          const someoneBoundValues = iterare(someone.getValueOrThrow().viewBindings)
            .map(vb => vb.boundValue)
            .toArray() as ViewBoundValue[]
          expect(three).toEqual(someoneBoundValues)
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
        it(`maps 8 to {{ value }}`, () => {
          const eight = Array.from(domDiffMap.get(8)!) as ViewBoundValue[]
          const node = counterCmp.view.getNthRoot(3)!.getFirstChild()!
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
        it(`maps 4 to {{ value }}`, () => {
          const four = Array.from(domDiffMap.get(4)!) as ViewBoundValue[]
          const node = toggleCmp.view.getNthRoot(1)!.getNthChild(1)!
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
        it(`maps 8 to {{ value }}`, () => {
          const actual = Array.from(domDiffMap.get(8)!) as ViewBoundValue[]
          const templateNode = counterCmp1.view.getByChildPath(3, 0)
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
        it(`maps 8 to {{ value }}`, () => {
          const actual = Array.from(domDiffMap.get(8)!) as ViewBoundValue[]
          const templateNode = counterCmp2.view.getByChildPath(3, 0)
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
            .findOrFail(isCmpNodeWithName('counter-cmp'))
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
        const map = app.getFaDiffMap()
        it(`has length three`, () => {
          expect(map.size).toBe(3)
        })
        describe(`set which maps from toggle-cmp`, () => {
          const set = map.get(toggleCmp)!
          it(`exists`, () => expect(set).not.toBeFalsy())
          it(`has size 1`, () => expect(set.size).toBe(1))
          it(`contains the "bool" binding to "value" input`, () => {
            const toggleCmpNodeValue = app.view
              .findOrFail(isCmpNodeWithName('toggle-cmp'))
              .getValueOrThrow()
            const inputBinding = toggleCmpNodeValue.getInputBindingByNameOrFail('value')
            const inputBindingBoundValue = inputBinding.boundValue as ViewBoundPropertyAccess
            const [setItem] = set
            expect(setItem).toBe(inputBindingBoundValue)
          })
        })
        describe(`set which maps from w:if isJavaScript`, () => {
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
      const app = apps.comparator.getFactoryTree()
      const [counterCmp1, counterCmp2, infoCmp] = app.getChildren().values()
      const [isLeftIsGreater, isRightIsGreater, areEqual] = infoCmp.getChildren().values()
      describe(`for CounterCmp1`, () => {
        it(`returns empty factory diff map because it has no children`, () => {
          expect(Array.from(counterCmp1.getFaDiffMap()).length).toBe(0)
        })
      })
      describe(`for CounterCmp2`, () => {
        it(`returns empty factory diff map because it has no children`, () => {
          expect(Array.from(counterCmp2.getFaDiffMap()).length).toBe(0)
        })
      })
      describe(`for IsLeftGreater`, () => {
        it(`returns empty factory diff map because it has no children`, () => {
          expect(Array.from(isLeftIsGreater.getFaDiffMap()).length).toBe(0)
        })
      })
      describe(`for IsRightGreater`, () => {
        it(`returns empty factory diff map because it has no children`, () => {
          expect(Array.from(isRightIsGreater.getFaDiffMap()).length).toBe(0)
        })
      })
      describe(`for AreEqual`, () => {
        it(`returns empty factory diff map because it has no children`, () => {
          expect(Array.from(areEqual.getFaDiffMap()).length).toBe(0)
        })
      })
      describe(`for InfoCmp`, () => {
        const map = infoCmp.getFaDiffMap()
        it(`has size 3`, () => expect(map.size).toEqual(3))
        describe(`set which maps from the first w:if`, () => {
          const set = map.get(isLeftIsGreater)!
          it(`exists`, () => expect(set).not.toBeFalsy())
          it(`has size 2`, () => expect(set.size).toBe(2))
          it(`contains the "isLeftGreater" binding`, () => {
            const isLeftGreaterNodeValue = infoCmp.view
              .findOrFail(isConditionalViewNodeWithVar('isLeftGreater'))
              .getValueOrThrow()
            const [binding] = isLeftGreaterNodeValue.viewBindings
            const boundValue = binding.boundValue as ViewBoundPropertyAccess
            expect(set.has(boundValue)).toBe(true)
          })
          it(`contains the "isGreaterString" binding`, () => {
            const isGreaterStringInterpolationNodeValue = isLeftIsGreater.view
              .findOrFail(isInterpolationNodeWithProp('isGreaterString'))
              .getValueOrThrow()
            const [binding] = isGreaterStringInterpolationNodeValue.viewBindings
            const boundValue = binding.boundValue as ViewBoundPropertyAccess
            expect(set.has(boundValue)).toBe(true)
          })
        })
        describe(`set which maps from the second w:if`, () => {
          const set = map.get(isRightIsGreater)!
          it(`exists`, () => expect(set).not.toBeFalsy())
          it(`has size 2`, () => expect(set.size).toBe(2))
          it(`contains the "isRightGreater" binding`, () => {
            const isRightGreaterNodeValue = infoCmp.view
              .findOrFail(isConditionalViewNodeWithVar('isRightGreater'))
              .getValueOrThrow()
            const [binding] = isRightGreaterNodeValue.viewBindings
            const boundValue = binding.boundValue as ViewBoundPropertyAccess
            expect(set.has(boundValue)).toBe(true)
          })
          it(`contains the "isGreaterString" binding`, () => {
            const isGreaterStringInterpolationNodeValue = isRightIsGreater.view
              .findOrFail(isInterpolationNodeWithProp('isGreaterString'))
              .getValueOrThrow()
            const [binding] = isGreaterStringInterpolationNodeValue.viewBindings
            const boundValue = binding.boundValue as ViewBoundPropertyAccess
            expect(set.has(boundValue)).toBe(true)
          })
        })
        describe(`set which maps from the third w:if`, () => {
          const set = map.get(areEqual)!
          it(`exists`, () => expect(set).not.toBeFalsy())
          it(`has size 1`, () => expect(set.size).toBe(1))
          it(`contains the "areEqual" binding`, () => {
            const areEqualNodeValue = infoCmp.view
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
        const map = app.getFaDiffMap()
        it(`has size 3`, () => expect(map.size).toBe(3))
        describe(`set which maps from counter-cmp (first)`, () => {
          const set = map.get(counterCmp1)!
          it(`exists`, () => expect(set).not.toBeFalsy())
          it(`has size 1`, () => expect(set.size).toBe(1))
          it(`contains the "left" binding to input [value]`, () => {
            const counterCmp1NodeValue = app.view.getByChildPath(3)
          })
        })
        describe(`set which maps from counter-cmp (second)`, () => {
          const set = map.get(counterCmp2)!
          it(`exists`, () => expect(set).not.toBeFalsy())
          it(`has size 1`, () => expect(set.size).toBe(1))
          it(`contains the "right" binding to input [value]`, () => {
            const counterCmp2NodeValue = app.view.getByChildPath(7)
          })
        })
        describe(`set which maps from info-cmp`, () => {
          const set = map.get(infoCmp)!
          it(`exists`, () => expect(set).not.toBeFalsy())
          it(`has size 2`, () => expect(set.size).toBe(2))
          it(`contains the "isLeftGreater" binding to [isLeftGreater] input`, () => {
            const infoCmpNodeValue = app.view
              .findOrFail(isCmpNodeWithName('info-cmp'))
              .getValueOrThrow()
            const binding = infoCmpNodeValue.getInputBindingByNameOrFail('isLeftGreater')
            expect(set.has(binding.boundValue as ViewBoundPropertyAccess)).toBe(true)
          })
          it(`contains the "isRightGreater" binding to input [isRightGreater]`, () => {
            const infoCmpNodeValue = app.view
              .findOrFail(isCmpNodeWithName('info-cmp'))
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
        const [_, greeting, __, someone] = app.view
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
      describe(`CounterCmp`, () => {
        it(`returns "CounterCmp"`, () => {
          expect(counterCmp.getClassName()).toBe(`CounterCmp`)
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
      describe(`for ToggleCmp`, () => {
        it(`returns "ToggleCmp"`, () => {
          expect(toggleCmp.getClassName()).toBe(`ToggleCmp`)
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
      describe(`for CounterCmp1`, () => {
        it(`returns "CounterCmp"`, () => {
          expect(counterCmp1.getClassName()).toBe(`CounterCmp`)
        })
      })
      describe(`for CounterCmp2`, () => {
        it(`returns "CounterCmp"`, () => {
          expect(counterCmp2.getClassName()).toBe(`CounterCmp`)
        })
      })
      describe(`for InfoCmp`, () => {
        it(`returns "InfoCmp"`, () => {
          expect(infoCmp.getClassName()).toBe(`InfoCmp`)
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
