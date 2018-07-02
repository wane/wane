import { expectDomStructure, h, runTest } from '../../utils'
import { expect } from 'chai'
import { getValue } from '../../utils/puppeteer-utils'

function dom (text: string) {
  return h.body([
    h.script({ src: 'index.js' }),
    h.p(text),
    h.label([
      h.span('Name'),
      h.input({ type: 'text' }),
    ]),
  ])
}

export default function () {
  return runTest(__dirname, async page => {

    const testDom = (text: string) => expectDomStructure(page, dom(text))

    // DOM structure on page init
    await testDom(`Hello, World!`)

    // Input value
    expect(await getValue(page, 'body > label > input')).to.eql('World')

    // Type "foo" into the box
    await page.focus(`body > label > input`)
    await page.type(`body > label > input`, `foo`)

    // The input value (where we're typing) is not messed with
    expect(await getValue(page, 'body > label > input')).to.eql(`Worldfoo`)

    // The paragraph is updated
    await testDom(`Hello, Worldfoo!`)

  })
}
