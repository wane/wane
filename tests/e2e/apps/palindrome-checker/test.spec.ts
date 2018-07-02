import { expectDomStructure, h, runTest } from '../../utils'
import { expect } from 'chai'
import { getValue, isFocused } from '../../utils/puppeteer-utils'

function dom (isPalindrome: boolean) {
  const yes = [
    `Yup, it's a `,
    h.b(`palindrome`),
    `!`,
  ]

  const no = [
    `Nah, this is `,
    h.strong(`not`),
    ` a palindrome.`,
  ]

  return h.body([
    h.script({ src: 'index.js' }),
    h.input({ type: 'text' }),
    ...(isPalindrome ? yes : no),
  ])
}

export default function () {
  return runTest(__dirname, async page => {

    const testDom = (isPalindrome: boolean) => expectDomStructure(page, dom(isPalindrome))

    // Initial page structure
    await testDom(true)

    // Typing "a" still keeps it being a palindrome
    await page.focus('input')
    await page.type('input', `a`)
    expect(await getValue(page, 'input')).to.equal(`a`)
    await testDom(true)

    // The previous test did not remove focus from the input
    expect(await isFocused(page, 'input')).to.eql(true)

    // Typing another letter makes it not a palindrome ("ab")
    await page.type(`input`, `b`)
    expect(await getValue(page, 'input')).to.eql(`ab`)
    await testDom(false)

    // Typing yet another letter makes it a palindrome again ("aba")
    await page.type(`input`, `a`)
    expect(await getValue(page, 'input')).to.eql(`aba`)
    await testDom(true)

  })
}
