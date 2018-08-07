import * as apps from './apps'
import { ClassDeclaration } from 'ts-simple-ast'
import iterare from 'iterare'
import { ComponentFactoryAnalyzer } from '../compiler/analyzer/factory-analyzer/component-factory-analyzer'
import { ConditionalViewFactoryAnalyzer } from '../compiler/analyzer/factory-analyzer/conditional-view-factory-analyzer'
import { RepeatingViewFactoryAnalyzer } from '../compiler/analyzer/factory-analyzer/repeating-view-factory-analyzer'
import { TemplateNodeHtmlValue, TemplateNodeInterpolationValue } from '../compiler/template-nodes'
import { assertIsInterpolationAndHasNoChildren, assertIsTextAndHasNoChildren } from './utils'
import { PartialViewFactoryAnalyzer } from '../compiler/analyzer/factory-analyzer/partial-view-factory-analyzer'
import { TemplateNodeTextValue } from "../compiler/template-nodes/nodes/text-node";

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
        .toEqual([`App`, `Counter`].sort())
    })
    it(`returns App and Toggle components for 03-toggler app`, () => {
      expect(names(apps.toggler.getAllRegisteredComponentsDeclarations()).sort())
        .toEqual([`App`, `Toggle`].sort())
    })
    it(`returns App, Counter and Info for 04-comparator app`, () => {
      expect(names(apps.comparator.getAllRegisteredComponentsDeclarations()).sort())
        .toEqual([`App`, `Counter`, `Info`].sort())
    })
    it(`returns App, Counter and Toggler for 05-deep-ifs`, () => {
      expect(names(apps.deepIfs.getAllRegisteredComponentsDeclarations()).sort())
        .toEqual([`App`, `Counter`, `Toggle`].sort())
    })
    it(`returns the only component for 06-hello-everyone`, () => {
      expect(names(apps.helloEveryone.getAllRegisteredComponentsDeclarations()).sort())
        .toEqual([`App`].sort())
    })
    it(`returns App and Item for 07-scoreboard`, () => {
      expect(names(apps.scoreboard.getAllRegisteredComponentsDeclarations()).sort())
        .toEqual([`App`, `Item`].sort())
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
        expect(child.getClassName()).toBe(`Counter`)
        expect(child.getParent()).toBe(entry)
      })
      it(`has no other descendants`, () => {
        expect(Array.from(entryChildren[0][1].getChildren()).length).toBe(0)
      })
    })
    describe(`for 03-toggler`, () => {
      const app = apps.toggler
      const entry = app.getFactoryTree()
      const entryChildren = Array.from(entry.getChildrenFactories())
      const toggle = entryChildren[0] as ComponentFactoryAnalyzer
      const if1 = entryChildren[1] as ConditionalViewFactoryAnalyzer
      const if2 = entryChildren[2] as ConditionalViewFactoryAnalyzer
      it(`is a factory with three children`, () => {
        expect(entry.getClassName()).toBe(`App`)
        expect(entryChildren.length).toBe(3)
      })
      it(`has toggle as the first child`, () => {
        expect(toggle instanceof ComponentFactoryAnalyzer).toBe(true, `instanceof`)
        expect(toggle.getClassName()).toBe(`Toggle`)
        expect(toggle.getParentOrUndefined()).toBe(entry)
      })
      it(`has two conditional views as two other children`, () => {
        expect(if1 instanceof ConditionalViewFactoryAnalyzer).toBe(true, `first if, instanceof`)
        expect(if2 instanceof ConditionalViewFactoryAnalyzer).toBe(true, `second if, instanceof`)
        expect(if1.getParentOrUndefined()).toBe(entry)
        expect(if2.getParentOrUndefined()).toBe(entry)
      })
      it(`each conditional view has a partial view`, () => {
        const if1Children = [...if1.getChildrenFactories()]
        expect(if1Children.length).toBe(1)
        expect(if1Children[0] instanceof PartialViewFactoryAnalyzer).toBe(true, `partial view inside first if`)
        const if2Children = [...if2.getChildrenFactories()]
        expect(if2Children.length).toBe(1)
        expect(if2Children[0] instanceof PartialViewFactoryAnalyzer).toBe(true, `partial view inside second if`)
      })
      it(`partial views have no children`, () => {
        const [first] = if1.getChildrenFactories()
        const [second] = if2.getChildrenFactories()
        expect([...first.getChildrenFactories()].length).toBe(0)
        expect([...second.getChildrenFactories()].length).toBe(0)
      })
    })
    describe(`for 04-comparator`, () => {
      const app = apps.comparator
      const entry = app.getFactoryTree()
      const entryChildren = Array.from(entry.getChildrenFactories())
      const counter1 = entryChildren[0] as ComponentFactoryAnalyzer
      const counter2 = entryChildren[1] as ComponentFactoryAnalyzer
      const info = entryChildren[2] as ComponentFactoryAnalyzer
      it(`is a factory with three children`, () => {
        expect(entry.getClassName()).toBe(`App`)
        expect(entryChildren.length).toBe(3)
      })
      it(`has CounterCmp as the first child`, () => {
        expect(counter1 instanceof ComponentFactoryAnalyzer).toBe(true)
        expect(counter1.getClassName()).toBe(`Counter`)
        expect(counter1.getParentOrUndefined()).toBe(entry)
      })
      it(`has CounterCmp as the second child`, () => {
        expect(counter2 instanceof ComponentFactoryAnalyzer).toBe(true)
        expect(counter2.getClassName()).toBe(`Counter`)
        expect(counter2.getParentOrUndefined()).toBe(entry)
      })
      it(`has InfoCmp as the third child`, () => {
        expect(info instanceof ComponentFactoryAnalyzer).toBe(true)
        expect(info.getClassName()).toBe(`Info`)
      })
      it(`has InfoCmp as third child with three w:if children, each has a partial view, they have no other descendants`, () => {
        const children = Array.from(info.getChildrenFactories())
        const conditionalViews = [0, 1, 2].map(n => children[n])
        conditionalViews.forEach(conditionalView => {
          expect(conditionalView instanceof ConditionalViewFactoryAnalyzer).toBe(true)
          expect(conditionalView.getParentOrUndefined()).toBe(info)
          const children = [...conditionalView.getChildrenFactories()]
          expect(children.length).toBe(1)
          const [partial] = children
          expect([...partial.getChildrenFactories()].length).toBe(0)
          expect(partial.getParentOrUndefined()).toBe(conditionalView)
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
      it(`has 3 + 3 + 1 = 7 children`, () => {
        expect(entryChildren.length).toBe(7, entryChildren.map(c => c.getFactoryName()))
      })
      it(`counter-cmp has no children`, () => {
        const counterCmpFactories = entryChildren.slice(0, 3)
        counterCmpFactories.forEach(counterCmp => {
          expect(Array.from(counterCmp.getChildren()).length).toBe(0)
        })
      })
      it(`toggle-cmp has no children`, () => {
        const toggleCmpFactories = entryChildren.slice(3, 6)
        toggleCmpFactories.forEach(toggleCmp => {
          expect(Array.from(toggleCmp.getChildren()).length).toBe(0)
        })
      })
      it(`w:if visibility.a has one child, etc a chain until visibility.c which has none`, () => {
        const [wIfA] = entryChildren.slice(-1)
        expect(Array.from(wIfA.getChildrenFactories()).length).toBe(1, `a`)
        const wIfAChildren = [...wIfA.getChildrenFactories()]
        expect(wIfAChildren.length).toBe(1)
        const [pvA] = wIfAChildren
        expect(pvA instanceof PartialViewFactoryAnalyzer).toBe(true)

        const [wIfB] = Array.from(pvA.getChildrenFactories())
        expect(Array.from(wIfB.getChildrenFactories()).length).toBe(1, `b`)
        const wIfBChildren = [...wIfB.getChildrenFactories()]
        expect(wIfBChildren.length).toBe(1)
        const [pvB] = wIfBChildren
        expect(pvB instanceof PartialViewFactoryAnalyzer).toBe(true)

        const [wIfC] = Array.from(pvB.getChildrenFactories())
        expect(Array.from(wIfC.getChildrenFactories()).length).toBe(1, `c`)
        const wIfCChildren = [...wIfC.getChildrenFactories()]
        expect(wIfCChildren.length).toBe(1)
        const [pvC] = wIfCChildren
        expect(pvC instanceof PartialViewFactoryAnalyzer).toBe(true)

        expect([...pvC.getChildrenFactories()].length).toBe(0)
      })
    })
    describe(`for 06-hello-everyone`, () => {
      const entry = apps.helloEveryone.getFactoryTree()
      const entryChildren = Array.from(entry.getChildrenFactories())
      const wFor = entryChildren[0] as RepeatingViewFactoryAnalyzer
      it(`has a single child, a w:for`, () => {
        expect(entryChildren.length).toBe(1)
        expect(wFor instanceof RepeatingViewFactoryAnalyzer).toBe(true)
      })
      describe(`the single child w:for`, () => {
        it(`has app as parent`, () => {
          expect(wFor.getParentOrUndefined()).toBe(entry)
        })
        it(`has a single child, a partial view`, () => {
          const wForChildren = [...wFor.getChildrenFactories()]
          expect(wForChildren.length).toBe(1)
          const [partialView] = wForChildren
          expect(partialView instanceof PartialViewFactoryAnalyzer).toBe(true)
        })
        describe(`partial view`, () => {
          const partialView = [...wFor.getChildrenFactories()][0]
          it(`has w:for as parent`, () => {
            expect(partialView.getParentOrUndefined()).toBe(wFor)
          })
          it(`has no children`, () => {
            expect([...partialView.getChildrenFactories()].length).toBe(0)
          })
        })
      })
    })
    describe(`for 07-scoreboard`, () => {
      const entry = apps.scoreboard.getFactoryTree()
      const entryChildren = Array.from(entry.getChildrenFactories())
      const wFor = entryChildren[0] as RepeatingViewFactoryAnalyzer
      const wForChildren = Array.from(wFor.getChildrenFactories())
      const wForPartial = wForChildren[0] as PartialViewFactoryAnalyzer
      const wForPartialChildren = [...wForPartial.getChildrenFactories()]
      const itemCmp = wForPartialChildren[0] as ComponentFactoryAnalyzer
      it(`has a single w:for child`, () => {
        expect(entryChildren.length).toBe(1)
        expect(wFor instanceof RepeatingViewFactoryAnalyzer).toBe(true, wForPartial.constructor.name)
      })
      describe(`the single w:for child`, () => {
        it(`has the parent set to the entry component`, () => {
          expect(wFor.getParent()).toBe(entry)
        })
        it(`has a single partial view child`, () => {
          expect(wForChildren.length).toBe(1)
          expect(wForPartial instanceof PartialViewFactoryAnalyzer).toBe(true, wForPartial.constructor.name)
        })
        describe(`the single partial view child`, () => {
          it(`has the parent set to the w:for`, () => {
            expect(wForPartial.getParentOrUndefined()).toBe(wFor)
          })
          it(`has a single item-cmp child`, () => {
            expect(Array.from(wForPartial.getChildren()).length).toBe(1)
            expect(itemCmp instanceof ComponentFactoryAnalyzer).toBe(true)
          })
          describe(`the item-cmp factory`, () => {
            it(`has parent set to partial view`, () => {
              expect(itemCmp.getParent()).toBe(wForPartial)
            })
            it(`has no children`, () => {
              expect([...itemCmp.getChildrenFactories()].length).toBe(0)
            })
          })
        })
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
          it(`there are four in total`, () => {
            expect(Array.from(entry.getRoots()).length).toEqual(4)
          })
          it(`the first one is interpolation (greeting binding)`, () => {
            const value = entry.getNthRoot(0).getValueOrThrow()
            expect(value instanceof TemplateNodeInterpolationValue).toBe(true)
          })
          it(`the first one has no children`, () => {
            const node = entry.getNthRoot(0)
            expect(node.hasChildren()).toBe(false)
          })
          it(`the second one is text (comma between two interpolations)`, () => {
            const value = entry.getNthRoot(1).getValueOrThrow()
            expect(value instanceof TemplateNodeTextValue).toBe(true)
          })
          it(`the second one has no children`, () => {
            const node = entry.getNthRoot(1)
            expect(node.hasChildren()).toBe(false)
          })
          it(`the third one is interpolation (someone binding)`, () => {
            const value = entry.getNthRoot(2).getValueOrThrow()
            expect(value instanceof TemplateNodeInterpolationValue).toBe(true)
          })
          it(`the third one has no children`, () => {
            const node = entry.getNthRoot(2)
            expect(node.hasChildren()).toBe(false)
          })
          it(`the fourth one is text exclamation mark`, () => {
            const value = entry.getNthRoot(3).getValueOrThrow()
            expect(value instanceof TemplateNodeTextValue).toBe(true)
          })
          it(`the fourth one has no children`, () => {
            const node = entry.getNthRoot(3)
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
            it(`is 3: button, span, button`, () => {
              expect(view.getRootCount()).toBe(3)
            })
          })
          describe(`first child (button)`, () => {
            const child = view.getNthRoot(0)
            it(`is html element`, () => {
              expect(child.getValueOrThrow() instanceof TemplateNodeHtmlValue).toBe(true)
            })
            it(`has one child`, () => {
              expect(child.getChildrenCount()).toBe(1)
            })
            describe(`first child ("decrement")`, () => {
              assertIsTextAndHasNoChildren(child.getFirstChild()!)
            })
          })
          describe(`second child (span)`, () => {
            const child = view.getNthRoot(1)
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
          describe(`third child (button)`, () => {
            const child = view.getNthRoot(2)
            it(`is html element`, () => {
              expect(child.getValueOrThrow() instanceof TemplateNodeHtmlValue).toBe(true)
            })
            it(`has one child`, () => {
              expect(child.getChildrenCount()).toBe(1)
            })
            describe(`first child`, () => {
              assertIsTextAndHasNoChildren(child.getFirstChild()!)
            })
          })
        })
      })
      describe(`App component`, () => {

      })
    })

  })

})
