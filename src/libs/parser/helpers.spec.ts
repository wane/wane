import 'mocha'
import { assert } from 'chai'
import { areArraysEqualInAnyOrder } from './helpers'

describe(`areArraysEqualInAnyOrder`, () => {

  it(`returns true for same arrays`, () => {
    assert.isTrue(areArraysEqualInAnyOrder([1, 2, 3], [1, 2, 3]))
  })

  it(`returns true for same items, different order`, () => {
    assert.isTrue(areArraysEqualInAnyOrder([1, 2, 3], [3, 1, 2]))
  })

  it(`returns true for same items with repetitions`, () => {
    assert.isTrue(areArraysEqualInAnyOrder([1, 2, 3, 3], [1, 2, 3, 3]))
  })

  it(`returns true for same items, different order with repetitions`, () => {
    assert.isTrue(areArraysEqualInAnyOrder([1, 1, 2, 3], [2, 1, 3, 1]))
  })

  it(`returns false when left array has an extra item`, () => {
    assert.isFalse(areArraysEqualInAnyOrder([1, 2], [1]))
  })

  it(`returns false when right array has an extra item`, () => {
    assert.isFalse(areArraysEqualInAnyOrder([1], [1, 2]))
  })

  it(`returns true when arrays are empty`, () => {
    assert.isTrue(areArraysEqualInAnyOrder([], []))
  })

})
