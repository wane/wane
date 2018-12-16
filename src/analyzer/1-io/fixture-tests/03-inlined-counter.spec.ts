import 'mocha'
import { assert } from 'chai'
import { Io } from '../index'
import * as path from "path"
import { getFixturesAbsolutePath } from './utils'


describe(`Io`, () => {

  const fixturePath = path.resolve(getFixturesAbsolutePath(__dirname), '03-inlined-counter')
  const io = new Io(fixturePath)

  describe(`03 Inlined Counter`, () => {

    it(`should read a single component, the entry`, () => {
      assert.lengthOf(io.getComponents(), 1)
      assert.sameMembers(io.getComponents(), [io.getEntryComponent()])
    })

    describe(`Entry component`, () => {
      const entry = io.getEntryComponent()

      describe(`registered components`, () => {
        it(`are none`, () => {
          const registered = entry.getRegisteredComponentClassDeclarations()
          assert.lengthOf(registered, 0)
        })
      })

      describe(`members`, () => {
        const members = entry.getMembers()

        it(`are two: a prop "name" and a method "change"`, () => {
          assert.lengthOf(members, 2)

          const props = entry.getProperties()
          assert.lengthOf(props, 1)
        })

        describe(`method "change"`, () => {
          const method = entry.getMethodOrThrow('change')

          it(`calls no methods`, () => {
            assert.lengthOf(method.getCalledMethods(), 0)
          })

          it(`modifies "value"`, () => {
            assert.sameMembers(method.getModifiedProperties(), [entry.getMemberOrThrow('value')])
          })
        })
      })

      describe(`template`, () => {
        const template = entry.getTemplate()

        it(`uses both members`, () => {
          assert.sameMembers(template.getUsedMemberNames(), ['value', 'change'])
        })

      })

    })

  })

})
