import { expectDomStructure, h, runTest } from '../../utils'
import { expect } from 'chai'

const BUTTON_DEC = 'body > w-counter > button:nth-child(1)'
const BUTTON_INC = 'body > w-counter > button:nth-child(3)'

const appShadow = {'data-w-0': ''}
const counterShadow = {'data-w-1': ''}

function dom (value: number) {
  return h.body([
    h.script({ src: 'index.js' }),
    h('w-counter', appShadow, [
      h.button(counterShadow, ['Decrement']),
      h.div(counterShadow, [
        h.span(counterShadow, [value.toString()])
      ]),
      h.button(counterShadow, ['Increment']),
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
