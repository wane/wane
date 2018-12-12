import 'mocha'
import { assert } from 'chai'
import { ComponentPropertyIoNode, Io } from '..'
import { isInstance } from '../../../libs/is-instance-ts'
import { WtmlInterpolationNode } from '../../../template-compiler/markup/tree-creator/wtml-nodes'


export default function (io: Io) {

  describe(`01 Hello World`, () => {

    it(`should read a single component: the entry`, () => {
      assert.lengthOf(io.getComponents(), 1)
      assert.equal(io.getEntryComponent(), io.getComponents()[0])
    })

    describe(`Entry`, () => {
      const entry = io.getEntryComponent()

      describe(`registered components`, () => {

        it(`are none`, () => {
          const registeredComponents = entry.getRegisteredComponentClassDeclarations()
          assert.lengthOf(registeredComponents, 0)
        })

      })

      describe(`members`, () => {

        it(`are only one: a property "name"`, () => {
          const allMembers = entry.getMembers()
          assert.equal(allMembers.length, 1, `More than one member.`)

          const props = entry.getMembers(isInstance(ComponentPropertyIoNode))
          assert.lengthOf(props, 1, `More than one property.`)

          const nameProp = entry.getMember('name')
          assert.isDefined(nameProp)
        })

      })

      describe(`template`, () => {
        const template = entry.getTemplate()
        const root = template.getWtmlPhantomRoot()

        it(`has three nodes`, () => {
          assert.lengthOf(root.getAllDescendants(), 3)
        })

        it(`has one interpolation node`, () => {
          const interpolationNode = root.find(isInstance(WtmlInterpolationNode))!
          assert.isDefined(interpolationNode)
          assert.equal(interpolationNode.getText(), ' name ')
          const tree = interpolationNode.getBindingSyntaxTree()
          assert.sameOrderedMembers(tree.getUsedMemberNames(), ['name'])
        })

        it(`uses only "name"`, () => {
          assert.sameMembers(template.getUsedMemberNames(), ['name'])
        })

      })

    })

  })

}
