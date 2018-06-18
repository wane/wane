import * as apps from './apps'
import iterare from 'iterare'
import {InterpolationBinding} from '../compiler/template-nodes/view-bindings'
import CodeBlockWriter from "code-block-writer";

const helloWorldBindings = iterare(apps.helloWorld.getFactoryTree().view).map(root => root.getValueOrThrow().viewBindings).toArray()

describe(`Structure of`, () => {

  describe(`01-hello-world`, () => {
    it(`should have five interpolation nodes`, () => {
      expect(Array.from(apps.helloWorld.getFactoryTree().view).length).toBe(5)
      helloWorldBindings.forEach(bindings => {
        expect(Array.from(bindings).length).toBe(1)
        expect(Array.from(bindings)[0] instanceof InterpolationBinding).toBe(true)
      })
    })
  })

})

describe(`InterpolationBinding`, () => {

  describe(`printInit`, () => {
    describe(`01-hello-world`, () => {
      const [[whitespace], [greeting], [_comma], [someone]] = helloWorldBindings
      it(`prints an empty string for leading whitespace because it will be initialized when dom is created`, () => {
        const wr = new CodeBlockWriter()
        whitespace.printInit(wr, `xxx`)
        expect(wr.toString()).toBe(``)
      })
      it(`prints an empty string for {{ greeting }} and {{ someone }} because it is already initialized when dom is created`, () => {
        const wr = new CodeBlockWriter()
        greeting.printInit(wr, `xxx`)
        expect(wr.toString()).toBe(``)
        const wr2 = new CodeBlockWriter()
        someone.printInit(wr, `xxx`)
        expect(wr2.toString()).toBe(``)
      })
    })
  })

  describe(`getResponsibleFactory`, () => {
    describe(`01-hello-world`, () => {
      it(`returns App for everything since that's the only factory anyway`, () => {
        for (const viewBindingSet of helloWorldBindings) {
          for (const binding of viewBindingSet) {
            expect(binding.getResponsibleFactory()).toBe(apps.helloWorld.getFactoryTree())
          }
        }
      })
    })
  })

  describe(`getDefinitionFactory`, () => {
    describe(`01-hello-world`, () => {
      it(`returns App for everything since that's the only factory anyway`, () => {
        for (const viewBindingSet of helloWorldBindings) {
          for (const binding of viewBindingSet) {
            expect(binding.getDefinitionFactory()).toBe(apps.helloWorld.getFactoryTree())
          }
        }
      })
    })
  })

})


describe(`AttributeBinding`, () => {

})


describe(`HtmlElementPropBinding`, () => {

})


describe(`HtmlElementEventBinding`, () => {

})


describe(`ComponentInputBinding`, () => {

})


describe(`ComponentOutputBinding`, () => {

})


describe(`ConditionalViewBinding`, () => {

})


describe(`RepeatingViewBinding`, () => {

})
