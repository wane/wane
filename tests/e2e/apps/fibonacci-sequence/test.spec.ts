import { expectDomStructure, h, runTest } from '../../utils'
import { expect } from 'chai'

function dom (array: number[]) {
  return h.body([
    h.script({ src: 'index.js' }),
    h.form([
      h.label([
        h.span(`Number of elements`),
        h.input({ type: 'number', name: 'numberOfElements' }),
      ]),
      h.button({ type: 'submit' }, [
        'Update',
      ]),
    ]),
    h.hr(),
    h.h1(`First ${array.length} Fibonacci numbers`),
    h('w-sequence', array.join(' ')),
  ])
}

export default function () {
  return runTest(__dirname, async page => {

    const testDom = (...array: number[]) => expectDomStructure(page, dom(array))

    // Initial page structure
    await testDom(1, 2, 3, 5, 8)

    // Updating to 6
    await page.focus('input')
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('Enter')
    await testDom(1, 2, 3, 5, 8, 13)

    // Updating back to 5
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await testDom(1, 2, 3, 5, 8)

    // Updating to 10
    await page.keyboard.press('Backspace')
    await page.type('input', `10`)
    await page.keyboard.press('Enter')
    await testDom(1, 2, 3, 5, 8, 13, 21, 34, 55, 89)

    // Updating to 0
    await page.keyboard.press('Backspace')
    await page.keyboard.press('Backspace')
    await page.type('input', `0`)
    await page.keyboard.press('Enter')
    await testDom()

    // Updating to 1
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('Enter')
    await testDom(1)

  })
}
