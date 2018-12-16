import 'mocha'
import { assert } from 'chai'
import { getFixturesAbsolutePath } from './utils'
import * as path from 'path'
import { Io } from '../index'

describe(`90`, () => {

  const fixturePath = path.resolve(getFixturesAbsolutePath(__dirname), '90-crud-table')
  const io = new Io(fixturePath)

  it(`should have three components`, () => {
    assert.lengthOf(io.getComponents(), 3)
  })

})
