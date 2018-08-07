import { expectDomStructure, h, runTest } from '../../utils'
import { expect } from 'chai'

function counter (value: number) {
  return h('w-counter', [
    h.button(`Decrement`),
    h.span(value.toString()),
    h.button(`Increment`),
  ])
}

function dom (left: number, right: number) {
  return h.body([
    h.script({ src: 'index.js' }),
    h.p(`Left is ${left}, right is ${right}.`),
    counter(left),
    counter(right),
  ])
}

const LEFT_DECREMENT = 'w-counter:first-of-type > button:first-of-type'
const LEFT_INCREMENT = 'w-counter:first-of-type > button:last-of-type'
const RIGHT_DECREMENT = 'w-counter:last-of-type > button:first-of-type'
const RIGHT_INCREMENT = 'w-counter:last-of-type > button:last-of-type'

export default function () {
  return runTest(__dirname, async page => {

    const testDom = (left: number, right: number) => expectDomStructure(page, dom(left, right))

    // Initial page structure
    await testDom(42, 21)

    await page.click(LEFT_DECREMENT)
    await testDom(41, 21)

    await page.click(LEFT_INCREMENT)
    await testDom(42, 21)

    await page.click(RIGHT_DECREMENT)
    await testDom(42, 20)

    await page.click(RIGHT_INCREMENT)
    await testDom(42, 21)

  })
}
