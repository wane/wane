import { expectDomStructure, h, runTest } from '../../utils'
import { expect } from 'chai'

const BUTTON_DEC = 'body > counter-cmp > button:nth-child(1)'
const BUTTON_INC = 'body > counter-cmp > button:nth-child(3)'

function dom (value: number) {
  return h.body([
    h.script({ src: 'index.js' }),
    h('counter-cmp', [
      h.button('Decrement'),
      h.span(value.toString()),
      h.button('Increment'),
    ]),
  ])
}

export default function () {
  return runTest(__dirname, async page => {

    const testDom = (value: number) => expectDomStructure(page, dom(value))

    // Initial page structure
    await testDom(42)

    // Decrementing
    await page.click(BUTTON_DEC)
    await testDom(41)

    // Incrementing
    await page.click(BUTTON_INC)
    await testDom(42)

  })
}
