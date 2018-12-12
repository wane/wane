import 'mocha'
import { assert } from 'chai'
import { Io, ComponentInputIoNode, ComponentOutputIoNode, ComponentMethodIoNode } from '../index'


export default function (io: Io) {

  describe(`04 Counter Component`, () => {

    it(`has two components`, () => {
      assert.lengthOf(io.getComponents(), 2)
    })

    describe(`Counter component`, () => {
      const counterCmp = io.getComponent('Counter')!
      it(`exists`, () => assert.isDefined(counterCmp))

      it(`has one prop which is input ("value"), and it's required`, () => {
        const props = counterCmp.getProperties()
        assert.lengthOf(props, 1)
        const inputs = counterCmp.getInputs()
        assert.lengthOf(inputs, 1)
        assert.sameMembers(props, inputs)

        const valueProp = counterCmp.getMember('value') as ComponentInputIoNode
        assert.isDefined(valueProp)
        assert.instanceOf(valueProp, ComponentInputIoNode)

        assert.isTrue(valueProp.isRequired())
      })

      it(`has two methods ("change", "onChange"), of which one is output ("change")`, () => {
        const methods = counterCmp.getMethods()
        assert.lengthOf(methods, 2)
        const outputs = counterCmp.getOutputs()
        assert.lengthOf(outputs, 1)

        const changeOutput = counterCmp.getMember('change') as ComponentOutputIoNode
        assert.instanceOf(changeOutput, ComponentOutputIoNode)

        const onChangeMethod = counterCmp.getMember('onChange') as ComponentOutputIoNode
        assert.notInstanceOf(onChangeMethod, ComponentOutputIoNode)
        assert.instanceOf(onChangeMethod, ComponentMethodIoNode)
      })
    })

  })

}
