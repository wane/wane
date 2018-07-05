import { and, isCmpNodeWithName, isInterpolationNodeWithProp, or } from './utils'
import { isType } from '../../utils/utils'
import { TemplateNodeComponentValue } from './component-node'
import { TemplateNodeInterpolationValue } from './interpolation-node'
import { InterpolationBinding } from '../view-bindings'
import { ViewBoundConstant, ViewBoundPropertyAccess } from '../view-bound-value'
import { TreeNode } from '../../utils/tree'

const position = {
  start: { column: 0, index: 0, line: 0 },
  end: { column: 0, index: 0, line: 0 },
}

const cmpNode = new TreeNode(
  new TemplateNodeComponentValue('tag-name', [], [], [], {
    type: 'element',
    tagName: 'tag-name',
    attributes: [],
    children: [],
    position,
  }),
)

const interpolationNode = new TreeNode(
  new TemplateNodeInterpolationValue(
    new InterpolationBinding(
      new ViewBoundPropertyAccess(`interpolated`),
    ),
    {
      type: 'text',
      content: `{{ interpolated }}`,
      position,
    },
  ),
)

const textNode = new TreeNode(
  new TemplateNodeInterpolationValue(
    new InterpolationBinding(
      new ViewBoundConstant(`'string'`),
    ),
    {
      type: 'text',
      content: `string`,
      position,
    },
  ),
)


describe(`utils`, () => {

  describe(`function and`, () => {

    describe(`passing in a single function`, () => {
      it(`should just propagate its return value`, () => {
        expect(and((x: any) => true)(1)).toBe(true)
      })
    })

    describe(`passing in two functions`, () => {
      it(`should return true only if both are true`, () => {
        const gt1 = (x: number) => x > 1
        const lt9 = (x: number) => x < 9
        const gt1lt9 = and(gt1, lt9)
        expect(gt1lt9(1)).toBe(false)
        expect(gt1lt9(5)).toBe(true)
        expect(gt1lt9(9)).toBe(false)
      })
    })

    describe(`passing in a bunch of functions`, () => {
      it(`should return true only if all of them are true`, () => {
        const isNumber = isType('number')
        const isEven = (x: number) => x % 2 == 0
        const isPositive = (x: number) => x > 0
        const ge10 = (x: number) => x >= 10
        const le99 = (x: number) => x <= 99
        const isTwoDigits = and(ge10, le99)
        const isMagic = and(isNumber, isEven, isPositive, isTwoDigits)
        expect([-10, 0, 1, 2, 3, 10, 11, 12, 13, '14', 98, 99, 100].filter(isMagic)).toEqual([10, 12, 98])
      })
    })

  })

  describe(`function or`, () => {

    describe(`passing in a bunch of functions`, () => {
      it(`should return true if at least one is true`, () => {
        const isNumber = isType('number')
        const isString = isType('string')
        const isBoolean = isType('boolean')
        const isSimple = or(isNumber, isString, isBoolean)
        const arr = [{}, [], 1, '1', true]
        expect(arr.filter(isSimple)).toEqual([1, '1', true])
      })
    })

  })

  describe(`function componentNodeWithTagName`, () => {
    it(`should return true when it's true`, () => {
      expect(isCmpNodeWithName('tag-name')(cmpNode)).toBe(true)
    })
    it(`should return false when it's not true`, () => {
      expect(isCmpNodeWithName('false-tag-name')(cmpNode)).toBe(false)
    })
    it(`should return false when the tested node isn't even a component`, () => {
      expect(isCmpNodeWithName('tag-name')(interpolationNode)).toBe(false)
      expect(isCmpNodeWithName('interpolated')(interpolationNode)).toBe(false)
    })
  })

  // describe(`function isInterpolationNodeWithProp`, () => {
  //   it(`should return true when the given node matches`, () => {
  //     expect(isInterpolationNodeWithProp('interpolated')(interpolationNode)).toBe(true)
  //   })
  //   it(`should return false when the given prop access does not match`, () => {
  //     expect(isInterpolationNodeWithProp('whatever')(interpolationNode)).toBe(false)
  //   })
  //   it(`should return false when the node is pure text (not interpolation)`, () => {
  //     expect(isInterpolationNodeWithProp('interpolated')(textNode)).toBe(false)
  //   })
  //   it(`should return false when the node is not an interpolation node at all`, () => {
  //     expect(isInterpolationNodeWithProp('tag-name')(cmpNode)).toBe(false)
  //   })
  // })

})
