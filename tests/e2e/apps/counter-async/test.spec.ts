import { expectDomStructure, h, runTest } from '../../utils'

function sleep (ms: number) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })
}

function dom (count: number) {
  return h.body([
    h.script({ src: 'index.js' }),
    h('w-counter', [
      h.p(`The following button +1s once every 500ms.`),
      h.span(count.toString(10)),
      h.button(`+10`),
      h.button(`-10`),
      h.button(`+100 after one second`),
    ]),
  ])
}

const PLUS_TEN = `body > w-counter > button:nth-of-type(1)`
const MINUS_TEN = `body > w-counter > button:nth-of-type(2)`
const ASYNC = `body > w-counter > button:nth-of-type(3)`

export default function () {
  return runTest(__dirname, async (page) => {

    const testDom = (counter: number) => expectDomStructure(page, dom(counter))

    // Initial page structure
    await testDom(42)

    // After plus ten
    await page.click(PLUS_TEN)
    await testDom(52)

    // After 500ms, +1 has kicked in
    await sleep(500)
    await testDom(53)

    // After minus 10, twice
    await page.click(MINUS_TEN)
    await page.click(MINUS_TEN)
    await testDom(33)

    // Trigger the async +100
    await sleep(100)
    await page.click(ASYNC)

    // After 500ms, +1 has kicked in
    await sleep(500)
    await testDom(34)

    // After 510ms, +1 and +100 have kicked in
    await sleep(510)
    await testDom(135)

  })
}
