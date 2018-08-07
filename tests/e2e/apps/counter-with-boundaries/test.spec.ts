import { expectDomStructure, h, runTest } from '../../utils'
import { expect } from 'chai'
import { asyncRepeat } from '../../utils/puppeteer-utils'

interface DomProps {
  value: number | string
  isDisabled?: {
    minusTen?: boolean
    minusOne?: boolean
    plusOne?: boolean
    plusTen?: boolean
  }
}

function conditionallyAssign<T extends Object, U extends Object> (target: T, source: U, condition: boolean): T | (T & U) {
  return condition ? Object.assign(target, source) : target
}

function dom ({
                value,
                isDisabled: {
                  minusTen = false,
                  minusOne = false,
                  plusOne = false,
                  plusTen = false,
                } = {},
              }: DomProps) {
  return h.body([
    h.script({ src: 'index.js' }),
    h('w-counter', [
      h.button(conditionallyAssign({}, { disabled: '' }, minusTen), [`-10`]),
      h.button(conditionallyAssign({}, { disabled: '' }, minusOne), [`-1`]),
      h.button(conditionallyAssign({}, { disabled: '' }, plusOne), [`+1`]),
      h.button(conditionallyAssign({}, { disabled: '' }, plusTen), [`+10`]),
      h.span(value!.toString()),
    ]),
  ])
}

const MINUS_TEN = 'body > w-counter > button:nth-of-type(1)'
const MINUS_ONE = 'body > w-counter > button:nth-of-type(2)'
const PLUS_ONE = 'body > w-counter > button:nth-of-type(3)'
const PLUS_TEN = 'body > w-counter > button:nth-of-type(4)'

export default function () {
  return runTest(__dirname, async (page) => {

    const testDom = (domProps: DomProps) => expectDomStructure(page, dom(domProps))

    // Initial page structure
    await testDom({ value: 25 })

    // After two +10 clicks, +10 is disabled (at 45)
    await asyncRepeat(2, () => page.click(PLUS_TEN))
    await testDom({ value: 45, isDisabled: { plusTen: true } })

    // After five +1 clicks, both +1 and +10 are disabled (at 50)
    await asyncRepeat(5, () => page.click(PLUS_ONE))
    await testDom({ value: 50, isDisabled: { plusOne: true, plusTen: true } })

    // Disabled minus ten and minus one (at 0)
    await asyncRepeat(2, () => page.click(MINUS_TEN))
    await asyncRepeat(5, () => page.click(MINUS_ONE))
    await asyncRepeat(2, () => page.click(MINUS_TEN))
    await asyncRepeat(5, () => page.click(MINUS_ONE))
    await testDom({ value: 0, isDisabled: { minusOne: true, minusTen: true } })

  })
}
