import * as apps from './apps'
import { ClassDeclaration } from 'ts-simple-ast'
import iterare from 'iterare'
import { ComponentFactoryAnalyzer } from '../compiler/analyzer/factory-analyzer/component-factory-analyzer'
import { ConditionalViewFactoryAnalyzer } from '../compiler/analyzer/factory-analyzer/conditional-view-factory-analyzer'
import { RepeatingViewFactoryAnalyzer } from '../compiler/analyzer/factory-analyzer/repeating-view-factory-analyzer'
import { TemplateNodeHtmlValue, TemplateNodeInterpolationValue } from '../compiler/template-nodes'
import { assertIsInterpolationAndHasNoChildren } from './utils'

describe(`ProjectAnalyzer`, () => {

  describe(`getEntryComponentDeclaration`, () => {
    it(`returns entry component for 01-hello-world app`, () => {
      expect(apps.helloWorld.getEntryComponentDeclaration().getName()).toBe(`App`)
    })
    it(`returns entry component for 02-counter app`, () => {
      expect(apps.counter.getEntryComponentDeclaration().getName()).toBe(`App`)
    })
    it(`returns entry component for 03-toggler app`, () => {
      expect(apps.toggler.getEntryComponentDeclaration().getName()).toBe(`App`)
    })
    it(`returns entry component for 04-comparator app`, () => {
      expect(apps.comparator.getEntryComponentDeclaration().getName()).toBe(`App`)
    })
    it(`returns entry component for 05-deep-ifs app`, () => {
      expect(apps.deepIfs.getEntryComponentDeclaration().getName()).toBe(`App`)
    })
    it(`returns entry component for 06-hello-everyone`, () => {
      expect(apps.helloEveryone.getEntryComponentDeclaration().getName()).toBe(`App`)
    })
    it(`returns entry component for 07-scoreboard`, () => {
      expect(apps.scoreboard.getEntryComponentDeclaration().getName()).toBe(`App`)
    })
  })

  describe(`getAllRegisteredComponentsDeclarations`, () => {
    const names = (classDeclarations: Iterable<ClassDeclaration>) => iterare(classDeclarations)
      .map(klass => klass.getName())
      .toArray()

    it(`returns the only component for 01-hello-world app`, () => {
      expect(names(apps.helloWorld.getAllRegisteredComponentsDeclarations()).sort())
        .toEqual([`App`].sort())
    })
    it(`returns App and Counter components for 02-counter app`, () => {
      expect(names(apps.counter.getAllRegisteredComponentsDeclarations()).sort())
        .toEqual([`App`, `CounterCmp`].sort())
    })
    it(`returns App and Toggle components for 03-toggler app`, () => {
      expect(names(apps.toggler.getAllRegisteredComponentsDeclarations()).sort())
        .toEqual([`App`, `ToggleCmp`].sort())
    })
    it(`returns App, Counter and Info for 04-comparator app`, () => {
      expect(names(apps.comparator.getAllRegisteredComponentsDeclarations()).sort())
        .toEqual([`App`, `CounterCmp`, `InfoCmp`].sort())
    })
    it(`returns App, Counter and Toggler for 05-deep-ifs`, () => {
      expect(names(apps.deepIfs.getAllRegisteredComponentsDeclarations()).sort())
        .toEqual([`App`, `CounterCmp`, `ToggleCmp`].sort())
    })
    it(`returns the only component for 06-hello-everyone`, () => {
      expect(names(apps.helloEveryone.getAllRegisteredComponentsDeclarations()).sort())
        .toEqual([`App`].sort())
    })
    it(`returns App and Item for 07-scoreboard`, () => {
      expect(names(apps.scoreboard.getAllRegisteredComponentsDeclarations()).sort())
        .toEqual([`App`, `ItemCmp`].sort())
    })
  })

  describe(`getFactoryTree`, () => {
    describe(`for 01-hello-world`, () => {
      const app = apps.helloWorld.getFactoryTree()
      it(`is a single factory`, () => {
        expect(app.getClassName()).toBe(`App`)
        expect(Array.from(app.getChildren()).length).toBe(0)
        expect(app.getParentOrUndefined()).toBeUndefined()
      })
    })
    describe(`for 02-counter`, () => {
      const entry = apps.counter.getFactoryTree()
      const entryChildren = Array.from(entry.getChildren())
      it(`is a factory with a child`, () => {
        expect(entry.getClassName()).toBe(`App`)
        expect(entryChildren.length).toBe(1)
      })
      it(`has the correct child`, () => {
        expect(entryChildren[0][1] instanceof ComponentFactoryAnalyzer).toBe(true)
        const child = entryChildren[0][1] as ComponentFactoryAnalyzer
        expect(child.getClassName()).toBe(`CounterCmp`)
        expect(child.getParent()).toBe(entry)
      })
      it(`has no other descendants`, () => {
        expect(Array.from(entryChildren[0][1].getChildren()).length).toBe(0)
      })
    })
    describe(`for 03-toggler`, () => {
      const app = apps.toggler
      const entry = app.getFactoryTree()
      const entryChildren = Array.from(entry.getChildren())
      const toggle = entryChildren[0][1] as ComponentFactoryAnalyzer
      const if1 = entryChildren[1][1] as ConditionalViewFactoryAnalyzer
      const if2 = entryChildren[2][1] as ConditionalViewFactoryAnalyzer
      it(`is a factory with three children`, () => {
        expect(entry.getClassName()).toBe(`App`)
        expect(entryChildren.length).toBe(3)
      })
      it(`has toggle as the first child`, () => {
        expect(toggle instanceof ComponentFactoryAnalyzer).toBe(true, `instanceof`)
        expect(toggle.getClassName()).toBe(`ToggleCmp`)
        expect(toggle.getParentOrUndefined()).toBe(entry)
      })
      it(`has two conditional views as two other children`, () => {
        expect(if1 instanceof ConditionalViewFactoryAnalyzer).toBe(true, `first if, instanceof`)
        expect(if2 instanceof ConditionalViewFactoryAnalyzer).toBe(true, `second if, instanceof`)
        expect(if1.getParentOrUndefined()).toBe(entry)
        expect(if2.getParentOrUndefined()).toBe(entry)
      })
      it(`has no other descendants`, () => {
        expect(Array.from(toggle.getChildren()).length).toBe(0, `children of toggle`)
        expect(Array.from(if1.getChildren()).length).toBe(0, `children of if1`)
        expect(Array.from(if2.getChildren()).length).toBe(0, `children of if2`)
      })
    })
    describe(`for 04-comparator`, () => {
      const app = apps.comparator
      const entry = app.getFactoryTree()
      const entryChildren = Array.from(entry.getChildren())
      const counter1 = entryChildren[0][1] as ComponentFactoryAnalyzer
      const counter2 = entryChildren[1][1] as ComponentFactoryAnalyzer
      const info = entryChildren[2][1] as ComponentFactoryAnalyzer
      it(`is a factory with three children`, () => {
        expect(entry.getClassName()).toBe(`App`)
        expect(entryChildren.length).toBe(3)
      })
      it(`has CounterCmp as the first child`, () => {
        expect(counter1 instanceof ComponentFactoryAnalyzer).toBe(true)
        expect(counter1.getClassName()).toBe(`CounterCmp`)
        expect(counter1.getParentOrUndefined()).toBe(entry)
      })
      it(`has CounterCmp as the second child`, () => {
        expect(counter2 instanceof ComponentFactoryAnalyzer).toBe(true)
        expect(counter2.getClassName()).toBe(`CounterCmp`)
        expect(counter2.getParentOrUndefined()).toBe(entry)
      })
      it(`has InfoCmp as the third child`, () => {
        expect(info instanceof ComponentFactoryAnalyzer).toBe(true)
        expect(info.getClassName()).toBe(`InfoCmp`)
      })
      it(`has InfoCmp as third child with three w:if children and no other descendants`, () => {
        const children = Array.from(info.getChildrenFactories())
        const conditionalViews = [0, 1, 2].map(n => children[n])
        conditionalViews.forEach(conditionalView => {
          expect(conditionalView instanceof ConditionalViewFactoryAnalyzer).toBe(true)
          expect(Array.from(conditionalView.getChildren()).length).toBe(0)
          expect(conditionalView.getParentOrUndefined()).toBe(info)
        })
      })
      it(`has no other descendants`, () => {
        expect(Array.from(counter1.getChildren()).length).toBe(0)
        expect(Array.from(counter2.getChildren()).length).toBe(0)
      })
    })
    describe(`for 05-deep-ifs`, () => {
      const app = apps.deepIfs
      const entry = app.getFactoryTree()
      const entryChildren = Array.from(entry.getChildrenFactories())
      it(`has 5 + 5 + 1 children`, () => {
        expect(entryChildren.length).toBe(11, entryChildren.map(c => c.getFactoryName()))
      })
      it(`counter-cmp has no children`, () => {
        const counterCmpFactories = entryChildren.slice(0, 5)
        counterCmpFactories.forEach(counterCmp => {
          expect(Array.from(counterCmp.getChildren()).length).toBe(0)
        })
      })
      it(`toggle-cmp has no children`, () => {
        const toggleCmpFactories = entryChildren.slice(5, 10)
        toggleCmpFactories.forEach(toggleCmp => {
          expect(Array.from(toggleCmp.getChildren()).length).toBe(0)
        })
      })
      it(`w:if visibility.a has one child, etc a chain until visibility.e which has none`, () => {
        const [wIfA] = entryChildren.slice(-1)
        expect(Array.from(wIfA.getChildren()).length).toBe(1, `a`)
        const [wIfB] = Array.from(wIfA.getChildrenFactories()).slice(-1)
        expect(Array.from(wIfB.getChildren()).length).toBe(1, `b`)
        const [wIfC] = Array.from(wIfB.getChildrenFactories()).slice(-1)
        expect(Array.from(wIfC.getChildren()).length).toBe(1, `c`)
        const [wIfD] = Array.from(wIfC.getChildrenFactories()).slice(-1)
        expect(Array.from(wIfD.getChildren()).length).toBe(1, `d`)
        const [wIfE] = Array.from(wIfD.getChildrenFactories()).slice(-1)
        expect(Array.from(wIfE.getChildren()).length).toBe(0, `e`)
      })
    })
    describe(`for 06-hello-everyone`, () => {
      const app = apps.helloEveryone
      const entry = app.getFactoryTree()
      const entryChildren = Array.from(entry.getChildrenFactories())
      const child = entryChildren[0] as RepeatingViewFactoryAnalyzer
      it(`has a single child`, () => {
        expect(entryChildren.length).toBe(1)
        expect(child instanceof RepeatingViewFactoryAnalyzer).toBe(true)
      })
    })
    describe(`for 07-scoreboard`, () => {
      const entry = apps.scoreboard.getFactoryTree()
      const entryChildren = Array.from(entry.getChildrenFactories())
      const wFor = entryChildren[0] as RepeatingViewFactoryAnalyzer
      const wForChildren = Array.from(wFor.getChildrenFactories())
      const itemCmp = wForChildren[0] as ComponentFactoryAnalyzer
      it(`has a single w:for child`, () => {
        expect(entryChildren.length).toBe(1)
        expect(wFor instanceof RepeatingViewFactoryAnalyzer).toBe(true, itemCmp.constructor.name)
      })
      it(`w:for child has a single item-cmp child`, () => {
        expect(wForChildren.length).toBe(1)
        expect(itemCmp instanceof ComponentFactoryAnalyzer).toBe(true, itemCmp.constructor.name)
      })
      it(`item-cmp has no children`, () => {
        expect(Array.from(itemCmp.getChildren()).length).toBe(0)
      })
    })
  })

  describe(`view`, () => {

    /**
     * These tests only describe the structure of the view.
     * We do not test the number of bindings, etc here. We just test the HTML structure of the view.
     */

    describe(`for 01-hello-world`, () => {
      describe(`App`, () => {
        const entry = apps.helloWorld.getFactoryTree().view
        describe(`roots`, () => {
          it(`there are five in total`, () => {
            expect(Array.from(entry.getRoots()).length).toEqual(5)
          })
          it(`the first one is interpolation (constant leading whitespace)`, () => {
            const value = entry.getNthRoot(0).getValueOrThrow()
            expect(value instanceof TemplateNodeInterpolationValue).toBe(true)
          })
          it(`the first one has no children`, () => {
            const node = entry.getNthRoot(0)
            expect(node.hasChildren()).toBe(false)
          })
          it(`the second one is interpolation (greeting binding)`, () => {
            const value = entry.getNthRoot(1).getValueOrThrow()
            expect(value instanceof TemplateNodeInterpolationValue).toBe(true)
          })
          it(`the second one has no children`, () => {
            const node = entry.getNthRoot(1)
            expect(node.hasChildren()).toBe(false)
          })
          it(`the third one is interpolation (comma between two interpolations)`, () => {
            const value = entry.getNthRoot(2).getValueOrThrow()
            expect(value instanceof TemplateNodeInterpolationValue).toBe(true)
          })
          it(`the third one has no children`, () => {
            const node = entry.getNthRoot(2)
            expect(node.hasChildren()).toBe(false)
          })
          it(`the fourth one is interpolation (someone binding)`, () => {
            const value = entry.getNthRoot(3).getValueOrThrow()
            expect(value instanceof TemplateNodeInterpolationValue).toBe(true)
          })
          it(`the fourth one has no children`, () => {
            const node = entry.getNthRoot(3)
            expect(node.hasChildren()).toBe(false)
          })
          it(`the fifth one is interpolation (someone binding)`, () => {
            const value = entry.getNthRoot(4).getValueOrThrow()
            expect(value instanceof TemplateNodeInterpolationValue).toBe(true)
          })
          it(`the fifth one has no children`, () => {
            const node = entry.getNthRoot(4)
            expect(node.hasChildren()).toBe(false)
          })
        })
      })
    })

    describe(`for 02-counter`, () => {
      const appComponent = apps.counter.getFactoryTree()
      describe(`Counter component`, () => {
        const counterComponent = appComponent.getFirstChild()
        const view = counterComponent.view
        describe(`roots`, () => {
          describe(`length`, () => {
            it(`is 7: ws, button, ws, span, ws, button, ws`, () => {
              expect(view.getRootCount()).toBe(7)
            })
          })
          describe(`first child (whitespace)`, () => {
            assertIsInterpolationAndHasNoChildren(view.getNthRoot(0))
          })
          describe(`second child (button)`, () => {
            const child = view.getNthRoot(1)
            it(`is html element`, () => {
              expect(child.getValueOrThrow() instanceof TemplateNodeHtmlValue).toBe(true)
            })
            it(`has one child`, () => {
              expect(child.getChildrenCount()).toBe(1)
            })
            describe(`first child ("decrement")`, () => {
              assertIsInterpolationAndHasNoChildren(child.getFirstChild()!)
            })
          })
          describe(`third child (whitespace)`, () => {
            assertIsInterpolationAndHasNoChildren(view.getNthRoot(2))
          })
          describe(`fourth child (span)`, () => {
            const child = view.getNthRoot(3)
            it(`is html element`, () => {
              expect(child.getValueOrThrow() instanceof TemplateNodeHtmlValue).toBe(true)
            })
            it(`has one child`, () => {
              expect(child.getChildrenCount()).toBe(1)
            })
            describe(`first child`, () => {
              assertIsInterpolationAndHasNoChildren(child.getFirstChild()!)
            })
          })
          describe(`fifth child (whitespace)`, () => {
            assertIsInterpolationAndHasNoChildren(view.getNthRoot(4))
          })
          describe(`sixth child (button)`, () => {
            const child = view.getNthRoot(5)
            it(`is html element`, () => {
              expect(child.getValueOrThrow() instanceof TemplateNodeHtmlValue).toBe(true)
            })
            it(`has one child`, () => {
              expect(child.getChildrenCount()).toBe(1)
            })
            describe(`first child`, () => {
              assertIsInterpolationAndHasNoChildren(child.getFirstChild()!)
            })
          })
          describe(`seventh child (whitespace)`, () => {
            assertIsInterpolationAndHasNoChildren(view.getNthRoot(6))
          })
        })
      })
      describe(`App component`, () => {

      })
    })

  })

})
