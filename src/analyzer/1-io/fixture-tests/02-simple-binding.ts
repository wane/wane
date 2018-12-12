import { Io, ComponentPropertyIoNode, ComponentMethodIoNode } from '../index'
import * as path from 'path'
import { getFixturesAbsolutePath } from './utils'
import { assert } from 'chai'
import { isInstance } from '../../../libs/is-instance-ts'


describe(`Io`, () => {

  describe(`02 Simple Binding`, () => {

    const io = new Io(path.join(getFixturesAbsolutePath(__dirname), '02-simple-binding'))

    it(`should read a single component: the entry`, () => {
      assert.lengthOf(io.getComponents(), 1)
      assert.equal(io.getEntryComponent(), io.getComponents()[0])
    })

    describe(`Entry`, () => {
      const entry = io.getEntryComponent()

      describe(`registered components`, () => {
        const registered = entry.getRegisteredComponentClassDeclarations()
        it(`are none`, () => {
          assert.lengthOf(registered, 0)
        })
      })

      describe(`members`, () => {

        it(`are two: a property "name" and method "onChange"`, () => {
          const members = entry.getMembers()
          assert.lengthOf(members, 2)

          const props = entry.getMembers(isInstance(ComponentPropertyIoNode))
          assert.lengthOf(props, 1)

          const propName = entry.getMember('name')
          assert.instanceOf(propName, ComponentPropertyIoNode)

          const methodOnChange = entry.getMember('onChange')
          assert.instanceOf(methodOnChange, ComponentMethodIoNode)
        })

        describe(`"onChange"`, () => {
          const onChange = entry.getMethodOrThrow('onChange')

          it(`calls no methods`, () => {
            assert.lengthOf(onChange.getCalledMethods(), 0)
          })

          it(`modifies "name"`, () => {
            assert.sameMembers(onChange.getModifiedProperties(), [
              entry.getPropertyOrThrow('name'),
            ])
          })

        })

      })

      describe(`template`, () => {
        const template = entry.getWtmlTemplate()

        describe(`input node`, () => {
          const inputNode = template.findElementOrThrow('label')

          it(`exists`, () => {
            assert.isDefined(inputNode)
          })

          describe(`attributes`, () => {
            const allAttributes = inputNode.getAttributes()

            it(`has three: a plain, a [] and a ()`, () => {
              assert.lengthOf(allAttributes, 3)
              const plain = inputNode.getPlainAttributes()
              const bracketed = inputNode.getBracketedAttributes()
              const parenthesised = inputNode.getParenthesisedAttributes()
              assert.lengthOf(plain, 1)
              assert.lengthOf(bracketed, 1)
              assert.lengthOf(parenthesised, 1)
            })

            it(`type="text"`, () => {
              const attr = inputNode.getPlainAttributeOrThrow('type')
              assert.equal(attr.getValue(), 'text')
            })

            it(`[value]="name"`, () => {
              const attr = inputNode.getBracketedAttributeOrThrow('value')
              const tree = attr.getBindingSyntaxTree()
              assert.sameMembers(tree.getUsedMemberNames(), ['name'])
            })

            it(`(input)="onChange(#)"`, () => {
              const attr = inputNode.getParenthesisedAttributeOrThrow('input')
              const tree = attr.getBindingSyntaxTree()
              assert.isTrue(tree.isUsingPlaceholder())
              assert.equal(tree.getPlaceholderPosition(), 0)
              assert.sameMembers(tree.getUsedMemberNames(), ['onChange'])
            })

          })

        })

      })

    })

  })

})
