import 'mocha'
import { assert } from 'chai'
import { char, up, heavy, left, scoot, right } from './characters'

describe(`char`, () => {

  describe(`without fallback`, () => {

    it(`defaults to ┼`, () => {
      assert.equal(char(), '┼')
    })

    it(`sets up`, () => {
      assert.equal(char(up(heavy)), '╀')
    })

    it(`sets left and right`, () => {
      assert.equal(char(left(scoot), right(heavy)), '┝')
    })

  })

  describe(`with fallback`, () => {

    it(`defaults to ╋`, () => {
      assert.equal(char(heavy), '╋')
    })

  })

})
