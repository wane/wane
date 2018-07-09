import * as apps from './apps'
import iterare from 'iterare'
import CodeBlockWriter from "code-block-writer";

const helloWorldBindings = iterare(apps.helloWorld.getFactoryTree().view).map(root => root.getValueOrThrow().viewBindings).toArray()

describe(`InterpolationBinding`, () => {

  describe(`printInit`, () => {
    describe(`01-hello-world`, () => {
      const [[greeting], [_comma], [someone]] = helloWorldBindings
      it(`prints an empty string for {{ greeting }} and {{ someone }} because it is already initialized when dom is created`, () => {
        const wr = new CodeBlockWriter()
        greeting.printInit(wr, greeting.getResponsibleFactory())
        expect(wr.toString()).toBe(``)
        const wr2 = new CodeBlockWriter()
        someone.printInit(wr, greeting.getResponsibleFactory())
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
            expect(binding.getFirstScopeBoundaryUpwardsIncludingSelf()).toBe(apps.helloWorld.getFactoryTree())
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
